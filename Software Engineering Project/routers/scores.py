from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import models
from database import get_db
from schemas import ScoreCreate, ScoreResponse, ScoreUpdate

router = APIRouter()

@router.post(
    "",
    response_model=ScoreResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_score(score: ScoreCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(models.User).where(models.User.id == score.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    new_post = models.Score(
        game = score.game,
        val=score.val,
        user_id=score.user_id,
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post, attribute_names=["username"])
    return new_post

@router.get("/{score_id}", response_model=ScoreResponse)
async def get_score(score_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(models.Score).options(selectinload(models.Score.username)).where(models.Score.id == score_id))

    score = result.scalars().first()
    if score:
        return score
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Score not found")

@router.patch("/{score_id}", response_model=ScoreResponse)
async def update_score_partial(score_id: int, score_data: ScoreCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(models.Score).where(models.Score.id == score_id))
    score = result.scalars().first()
    if not score:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Score not found",)
    
    update_data = score_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(score, field, value)
    
    await db.commit()
    await db.refresh(score, attribute_names=["username"])
    return score
