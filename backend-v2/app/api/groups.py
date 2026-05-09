from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.group import Group, GroupMember, GroupInvitation
from app.models.post import Post
from app.models.user import User
from app.schemas.group import (
    GroupCreate, GroupDetailOut, GroupInvitationOut, GroupMemberOut,
    GroupOut, GroupUpdate, InviteCreate,
)

router = APIRouter(prefix="/api/groups", tags=["groups"])


def _membership_required(db: Session, user: User, group_id: int) -> Group:
    g = db.get(Group, group_id)
    if not g:
        raise HTTPException(404, "Group not found")
    is_owner = g.owner_id == user.id
    is_member = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group_id, GroupMember.user_id == user.id)
        .first()
        is not None
    )
    if not (is_owner or is_member):
        raise HTTPException(403, "Not a member of this group")
    return g


def _ownership_required(db: Session, user: User, group_id: int) -> Group:
    g = db.get(Group, group_id)
    if not g:
        raise HTTPException(404, "Group not found")
    if g.owner_id != user.id:
        raise HTTPException(403, "Only the group owner can do this")
    return g


def _group_out(db: Session, g: Group) -> GroupOut:
    out = GroupOut.model_validate(g)
    out.member_count = (
        db.query(func.count(GroupMember.user_id))
        .filter(GroupMember.group_id == g.id)
        .scalar() or 0
    )
    out.post_count = (
        db.query(func.count(Post.id))
        .filter(Post.group_id == g.id)
        .scalar() or 0
    )
    # owner counts as a member
    out.member_count += 1
    return out


def _attach_member(db: Session, group: Group, target_email: str, inviter: User):
    """Look up user by email; if found, add as member. Otherwise persist as pending invite."""
    u = db.query(User).filter(User.email == target_email).first()
    if u:
        if u.id == group.owner_id:
            return
        existing = (
            db.query(GroupMember)
            .filter(GroupMember.group_id == group.id, GroupMember.user_id == u.id)
            .first()
        )
        if not existing:
            db.add(GroupMember(group_id=group.id, user_id=u.id))
        return
    # Pending invite
    pending = (
        db.query(GroupInvitation)
        .filter(
            GroupInvitation.group_id == group.id,
            GroupInvitation.email == target_email,
            GroupInvitation.status == "pending",
        )
        .first()
    )
    if not pending:
        db.add(GroupInvitation(
            group_id=group.id, email=target_email, invited_by=inviter.id, status="pending"
        ))


@router.get("", response_model=list[GroupOut])
def list_my_groups(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    member_groups = (
        db.query(GroupMember.group_id).filter(GroupMember.user_id == current.id).subquery()
    )
    rows = (
        db.query(Group)
        .filter((Group.owner_id == current.id) | (Group.id.in_(member_groups)))
        .order_by(Group.id.desc())
        .all()
    )
    return [_group_out(db, g) for g in rows]


@router.post("", response_model=GroupOut, status_code=201)
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    g = Group(name=payload.name, owner_id=current.id)
    db.add(g)
    db.flush()
    for email in payload.invite_emails:
        _attach_member(db, g, str(email), current)
    db.commit()
    db.refresh(g)
    return _group_out(db, g)


@router.get("/{group_id}", response_model=GroupDetailOut)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    g = _membership_required(db, current, group_id)
    member_rows = (
        db.query(GroupMember, User)
        .join(User, User.id == GroupMember.user_id)
        .filter(GroupMember.group_id == group_id)
        .all()
    )
    members = [
        GroupMemberOut(
            user_id=u.id,
            user_name=u.name,
            user_email=u.email,
            user_avatar=u.avatar_url,
            joined_at=m.joined_at,
        )
        for m, u in member_rows
    ]
    # include the owner as a synthetic member entry for UI convenience
    owner = db.get(User, g.owner_id)
    if owner and not any(m.user_id == owner.id for m in members):
        members.insert(0, GroupMemberOut(
            user_id=owner.id, user_name=owner.name, user_email=owner.email,
            user_avatar=owner.avatar_url, joined_at=g.created_at,
        ))

    invs = (
        db.query(GroupInvitation)
        .filter(GroupInvitation.group_id == group_id, GroupInvitation.status == "pending")
        .all()
    )
    base = _group_out(db, g)
    return GroupDetailOut(
        **base.model_dump(),
        members=members,
        invitations=[GroupInvitationOut.model_validate(i) for i in invs],
    )


@router.patch("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: int,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    g = _ownership_required(db, current, group_id)
    if payload.name is not None:
        g.name = payload.name
    db.commit()
    db.refresh(g)
    return _group_out(db, g)


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    g = _ownership_required(db, current, group_id)
    db.delete(g)
    db.commit()


@router.post("/{group_id}/invite", response_model=GroupInvitationOut, status_code=201)
def invite_member(
    group_id: int,
    payload: InviteCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    g = _ownership_required(db, current, group_id)
    _attach_member(db, g, str(payload.email), current)
    db.commit()
    inv = (
        db.query(GroupInvitation)
        .filter(
            GroupInvitation.group_id == group_id,
            GroupInvitation.email == str(payload.email),
        )
        .order_by(GroupInvitation.id.desc())
        .first()
    )
    if inv:
        return GroupInvitationOut.model_validate(inv)
    # User existed and was added directly — synthesize a 1-shot accepted invite for the response
    return GroupInvitationOut(id=0, email=str(payload.email), status="accepted", created_at=g.created_at)


@router.delete("/{group_id}/members/{user_id}", status_code=204)
def remove_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    g = db.get(Group, group_id)
    if not g:
        raise HTTPException(404, "Group not found")
    # Owner can remove anyone; members can leave themselves.
    if not (g.owner_id == current.id or current.id == user_id):
        raise HTTPException(403, "Not allowed")
    if user_id == g.owner_id:
        raise HTTPException(400, "Owner cannot be removed; delete the group instead")
    db.query(GroupMember).filter(
        GroupMember.group_id == group_id, GroupMember.user_id == user_id
    ).delete()
    db.commit()


@router.delete("/{group_id}/invitations/{invite_id}", status_code=204)
def revoke_invitation(
    group_id: int,
    invite_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _ownership_required(db, current, group_id)
    inv = db.get(GroupInvitation, invite_id)
    if not inv or inv.group_id != group_id:
        raise HTTPException(404, "Invitation not found")
    inv.status = "revoked"
    db.commit()
