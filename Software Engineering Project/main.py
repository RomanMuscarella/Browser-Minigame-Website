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
        "content": "Tic Tac Toe",
        "icon": "tictactoe.png",
        "leaderboard": "tttList",
    },
    {
        "id": 2,
        "creator": "John Doe",
        "title": "Minesweeper",
        "content": "Minesweeper",
        "icon": "Minesweeper.png",
        "leaderboard": "msList",
    },
    {
        "id": 3,
        "creator": "John Doe",
        "title": "Word Game",
        "content": "Anagrams",
        "icon": "wordgame.png",
        "leaderboard": "wgList",
    },
    {
        "id": 4,
        "creator": "John Doe",
        "title": "Memory Game",
        "content": "Memory Game",
        "icon": "MemoryGame.png",
        "leaderboard": "mgList",
    },
    {
        "id": 5,
        "creator": "John Doe",
        "title": "Hyperspace Breaker",
        "content": "Hyperspace Breaker",
        "icon": "HyperspaceBreaker.png",
        "leaderboard": "hbList",
    },
    {
        "id": 6,
        "creator": "John Doe",
        "title": "Stack3D",
        "content": "Stack3D",
        "icon": "Stack3D.png",
        "leaderboard": "sdList",
    },
    {
        "id": 7,
        "creator": "John Doe",
        "title": "Wave Madness",
        "content": "Wave Madness",
        "icon": "WaveMadness.png",
        "leaderboard": "wmList",
    }
]




@app.get("/", include_in_schema=False, name="home")
def home(request: Request):
    list = games
    
    return templates.TemplateResponse(
        
        request,
        "index.html",
        {"games": list},
    )

@app.get("/games/menu", include_in_schema=False)
async def game_homepage(request: Request, db: Annotated[AsyncSession, Depends(get_db)]):
    gameLeaderboards = list()
    script = "script.js"
    for game in games:
        if(game.get("title") == "Minesweeper"):
            result = await db.execute(select(models.Score).where(models.Score.game == game.get("title")).order_by(models.Score.val).limit(3).options(selectinload(models.Score.username)))
            score = result.scalars().all()
            gameLeaderboards.append(score)
        else:
            result = await db.execute(select(models.Score).where(models.Score.game == game.get("title")).order_by(models.Score.val.desc()).limit(3).options(selectinload(models.Score.username)))
            score = result.scalars().all()
            gameLeaderboards.append(score)
    return templates.TemplateResponse(
        request,
        "home.html",
        {"script": script, "tttList": gameLeaderboards[0], "msList": gameLeaderboards[1], "wgList": gameLeaderboards[2], "mgList": gameLeaderboards[3], "hbList": gameLeaderboards[4], "sdList": gameLeaderboards[5], "wmList": gameLeaderboards[6]},
    )

@app.get("/games/{game_id}", include_in_schema=False)
async def game_page(request: Request, game_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    for game in games:
        if(game.get("id") == game_id):
            if(game.get("id") == 2):
                result = await db.execute(select(models.Score).where(models.Score.game == game.get("title")).order_by(models.Score.val).limit(10).options(selectinload(models.Score.username)))
            else:
                result = await db.execute(select(models.Score).where(models.Score.game == game.get("title")).order_by(models.Score.val.desc()).limit(10).options(selectinload(models.Score.username)))
            score = result.scalars().all()
            return templates.TemplateResponse(
            request,
            "gameWindowTemplate.html",
            {"game": game, "scores": score},
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