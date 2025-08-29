from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    age: int


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    age: int
    role: str

    class Config:
        from_attributes = True  # ORM -> Pydantic


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# 🔹 New: JWT Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
