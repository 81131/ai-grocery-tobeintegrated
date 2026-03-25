from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str 
    password: str 
    role: Optional[str] = "customer"

# --- NEW: Driver Schemas ---
class DriverCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: str
    license_number: str
    vehicle_type: str
    assigned_city: str

class DriverProfileResponse(BaseModel):
    driver_id: int
    license_number: str
    vehicle_type: str
    is_available: bool
    rating: float
    total_deliveries: int

    class Config:
        from_attributes = True

class DriverUserResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    driver_profile: Optional[DriverProfileResponse]

    class Config:
        from_attributes = True