from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, db, utils
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.models.user import User
from app.db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


def assign_role(age: int) -> str:
    if 1 <= age <= 5:
        return "Kid"
    elif 6 <= age <= 15:
        return "Teen"
    else:
        return "Adult"


@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, database: Session = Depends(db.get_db)):
    existing_user = database.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = utils.hash_password(user.password)
    role = assign_role(user.age)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_pw,
        age=user.age,
        role=role
    )
    database.add(new_user)
    database.commit()
    database.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not utils.verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create JWT
    token_data = {"sub": str(db_user.id), "email": db_user.email, "role": db_user.role}
    access_token = utils.create_access_token(data=token_data)

    return {"access_token": access_token, "token_type": "bearer", "role": db_user.role}
