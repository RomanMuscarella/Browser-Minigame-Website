from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field




class UserBase(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr = Field(max_length=120)
    id: int = Field(gt=0)

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_file: str | None
    image_path: str

class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=50)
    email: EmailStr | None = Field(default=None, max_length=120)
    image_file: str | None = Field(default=None, min_length=1, max_length=200)





class ScoreBase(BaseModel):
    game: str = Field(min_length=1)
    val: int = Field(gt=0)

class ScoreCreate(ScoreBase):
    user_id: int

class ScoreUpdate(BaseModel):
    game: str | None = Field(default=None, min_length=1, max_length=100)
    val: int | None = Field(default=None, gt=0)


class ScoreResponse(ScoreBase):
    model_config = ConfigDict(from_attributes = True)

    user_id: int
    date_posted: datetime
    username: UserResponse
