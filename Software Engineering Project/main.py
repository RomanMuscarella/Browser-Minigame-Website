from contextlib import asynccontextmanager
from typing import Annotated

from fastapi.exception_handlers import http_exception_handler, request_validation_exception_handler

from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import models as models
from routers import scores
from database import Base, engine, get_db
from routers import users


@asynccontextmanager
async def lifespan(_app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/media", StaticFiles(directory="media"), name="media")

templates = Jinja2Templates(directory="templates")

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(scores.router, prefix="/api/scores", tags=["scores"])

games: list[dict] = [
    {
        "id": 1,
        "creator": "John Doe",
        "title": "Tic-Tac-Toe",
        "content": "ticTacToe.js"
    },
    {
        "id": 2,
        "creator": "John Doe",
        "title": "Minesweeper",
        "content": "ticTacToe.js"
    },
    {
        "id": 3,
        "creator": "John Doe",
        "title": "2048",
        "content": "ticTacToe.js"
    }
]




@app.get("/", include_in_schema=False, name="home")
def home(request: Request):
    script = "script.js"
    return templates.TemplateResponse(
        request,
        "home.html",
        {"script": script},
    )

@app.get("/games/{game_id}", include_in_schema=False)
async def game_page(request: Request, game_id: int, db: Annotated[AsyncSession, Depends(get_db)]):

    result = await db.execute(select(models.Score).options(selectinload(models.Score.username)))

    score = result.scalars().first()

    for game in games:
        if(game.get("id") == game_id):
            return templates.TemplateResponse(
            request,
            "gameWindowTemplate.html",
            {"game": game, "score": score},
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

@app.get("/login", include_in_schema = False)
async def login_page(request: Request):
    return templates.TemplateResponse(
        request,
        "login.html",
        {"title": "Login"},
    )

@app.get("/signup", include_in_schema = False)
async def signup_page(request: Request):
    return templates.TemplateResponse(
        request,
        "signup.html",
        {"title": "Signup"},
    )

@app.get("/account", include_in_schema=False)
async def account_page(request: Request):
    return templates.TemplateResponse(
        request, "account.html", {"title": "Account"},
    )




@app.exception_handler(StarletteHTTPException)
async def general_http_exception_handler(request: Request, exception: StarletteHTTPException):

    if request.url.path.startswith("/api"):
        return await http_exception_handler(request, exception)
    
    message = (
        exception.detail
        if exception.detail
        else "An error occurred. Please check your request and try again."
    )

    return templates.TemplateResponse(
        request,
        "error.html",
        {
            "status_code": exception.status_code,
            "title": exception.status_code,
            "message": message,
        },
        status_code=exception.status_code,
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exception: RequestValidationError):
    if request.url.path.startswith("/api"):
        return await request_validation_exception_handler(request, exception)
    return templates.TemplateResponse(
        request,
        "error.html",
        {
            "status_code": status.HTTP_422_UNPROCESSABLE_CONTENT,
            "title": status.HTTP_422_UNPROCESSABLE_CONTENT,
            "message": "Invalid request. Please check your input and try again.",
        },
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    )