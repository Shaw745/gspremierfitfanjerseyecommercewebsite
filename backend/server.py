from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, UploadFile, File, Form, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import httpx
import hmac
import hashlib
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET', 'gs-premier-fit-fan-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Paystack Settings
PAYSTACK_SECRET_KEY = os.environ.get('PAYSTACK_SECRET_KEY', '')
PAYSTACK_PUBLIC_KEY = os.environ.get('PAYSTACK_PUBLIC_KEY', '')

# CoinGecko API
COINGECKO_API_KEY = os.environ.get('COINGECKO_API_KEY', '')

# Resend Email
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
resend.api_key = RESEND_API_KEY

# Crypto Wallets
CRYPTO_WALLETS = {
    'btc': os.environ.get('BTC_WALLET', ''),
    'eth': os.environ.get('ETH_WALLET', ''),
    'usdt_trc20': os.environ.get('USDT_TRC20_WALLET', ''),
    'usdc_erc20': os.environ.get('USDC_ERC20_WALLET', '')
}

# Bank Details
BANK_DETAILS = {
    'bank_name': os.environ.get('BANK_NAME', ''),
    'account_number': os.environ.get('BANK_ACCOUNT_NUMBER', ''),
    'account_name': os.environ.get('BANK_ACCOUNT_NAME', '')
}

# Inventory Alert Threshold
LOW_STOCK_THRESHOLD = 10

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Gs Premier Fit Fan API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    is_admin: bool = False
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    compare_price: Optional[float] = None
    category: str
    sport: str
    sizes: List[str]
    colors: List[str]
    images: List[str]
    video_url: Optional[str] = None
    stock: int = 0
    featured: bool = False
    collection: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    category: Optional[str] = None
    sport: Optional[str] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    images: Optional[List[str]] = None
    video_url: Optional[str] = None
    stock: Optional[int] = None
    featured: Optional[bool] = None
    collection: Optional[str] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: str
    color: str

class AddToCart(BaseModel):
    product_id: str
    quantity: int = 1
    size: str
    color: str

class ShippingAddress(BaseModel):
    full_name: str
    address: str
    city: str
    state: str
    country: str = "Nigeria"
    phone: str
    email: EmailStr

class OrderCreate(BaseModel):
    shipping_address: ShippingAddress
    payment_method: str  # paystack, crypto_btc, crypto_eth, crypto_usdt, crypto_usdc, bank_transfer
    items: List[CartItem]
    notes: Optional[str] = None

class PaymentVerify(BaseModel):
    reference: str
    order_id: str

class ThemeSettings(BaseModel):
    primary_color: str = "#050505"
    accent_color: str = "#CCFF00"
    secondary_color: str = "#FFFFFF"

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    title: str
    comment: str

class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    carrier: Optional[str] = None
    notes: Optional[str] = None

class TrackingUpdate(BaseModel):
    status: str
    location: Optional[str] = None
    description: str

# ==================== EMAIL HELPERS ====================

async def send_order_confirmation_email(order: dict, user_email: str):
    """Send order confirmation email to customer"""
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured, skipping email")
        return
    
    items_html = ""
    for item in order.get("items", []):
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.get('product_name', 'Product')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.get('size', '-')} / {item.get('color', '-')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.get('quantity', 1)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">₦{item.get('item_total', 0):,.0f}</td>
        </tr>
        """
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: #050505; padding: 30px; text-align: center;">
            <h1 style="color: #CCFF00; margin: 0; font-size: 24px;">GS PREMIER FIT FAN</h1>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #050505; margin-bottom: 20px;">Order Confirmation</h2>
            <p style="color: #666;">Thank you for your order! Here are your order details:</p>
            
            <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #CCFF00;">
                <p style="margin: 0;"><strong>Order Reference:</strong> {order.get('reference', 'N/A')}</p>
                <p style="margin: 5px 0 0;"><strong>Status:</strong> {order.get('status', 'pending').upper()}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #050505; color: #fff;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: left;">Size/Color</th>
                        <th style="padding: 10px; text-align: left;">Qty</th>
                        <th style="padding: 10px; text-align: left;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #050505;">
                <p style="font-size: 20px; font-weight: bold; color: #050505;">Total: ₦{order.get('total', 0):,.0f}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f9f9f9;">
                <h3 style="margin-top: 0; color: #050505;">Shipping Address</h3>
                <p style="margin: 0; color: #666;">
                    {order.get('shipping_address', {}).get('full_name', '')}<br>
                    {order.get('shipping_address', {}).get('address', '')}<br>
                    {order.get('shipping_address', {}).get('city', '')}, {order.get('shipping_address', {}).get('state', '')}<br>
                    {order.get('shipping_address', {}).get('country', 'Nigeria')}
                </p>
            </div>
        </div>
        <div style="background: #050505; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Gs Premier Fit Fan. All rights reserved.</p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [user_email],
            "subject": f"Order Confirmed - {order.get('reference', 'N/A')}",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order confirmation email sent to {user_email}")
    except Exception as e:
        logger.error(f"Failed to send order email: {str(e)}")

async def send_shipping_update_email(order: dict, user_email: str, tracking_info: dict):
    """Send shipping update email to customer"""
    if not RESEND_API_KEY:
        return
    
    tracking_html = ""
    if tracking_info.get("tracking_number"):
        tracking_html = f"""
        <div style="background: #CCFF00; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #050505;">Tracking Number: {tracking_info.get('tracking_number')}</p>
            <p style="margin: 5px 0 0; color: #050505;">Carrier: {tracking_info.get('carrier', 'N/A')}</p>
            {"<a href='" + tracking_info.get('tracking_url') + "' style='color: #050505;'>Track Your Package</a>" if tracking_info.get('tracking_url') else ""}
        </div>
        """
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #050505; padding: 30px; text-align: center;">
            <h1 style="color: #CCFF00; margin: 0;">GS PREMIER FIT FAN</h1>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #050505;">Shipping Update</h2>
            <p>Your order <strong>{order.get('reference')}</strong> status has been updated to: <strong>{order.get('status', '').upper()}</strong></p>
            {tracking_html}
            <p style="color: #666;">If you have any questions, please contact our support team.</p>
        </div>
        <div style="background: #050505; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Gs Premier Fit Fan</p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [user_email],
            "subject": f"Shipping Update - Order {order.get('reference')}",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Shipping update email sent to {user_email}")
    except Exception as e:
        logger.error(f"Failed to send shipping email: {str(e)}")

async def send_low_stock_alert(product: dict):
    """Send low stock alert to admin"""
    if not RESEND_API_KEY:
        return
    
    admin = await db.users.find_one({"is_admin": True}, {"_id": 0})
    if not admin:
        return
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">⚠️ LOW STOCK ALERT</h1>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #050505;">{product.get('name')}</h2>
            <p style="font-size: 24px; color: #ef4444; font-weight: bold;">Only {product.get('stock')} items remaining!</p>
            <p style="color: #666;">Please restock this product soon to avoid stockouts.</p>
            <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Product ID:</strong> {product.get('id')}</p>
                <p style="margin: 5px 0 0;"><strong>Category:</strong> {product.get('category')}</p>
                <p style="margin: 5px 0 0;"><strong>Sport:</strong> {product.get('sport')}</p>
            </div>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [admin.get("email")],
            "subject": f"Low Stock Alert - {product.get('name')}",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Low stock alert sent for {product.get('name')}")
    except Exception as e:
        logger.error(f"Failed to send low stock alert: {str(e)}")

# ==================== AUTH HELPERS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "wishlist": [],
        "addresses": []
    }
    await db.users.insert_one(user)
    
    token = create_access_token({"sub": user_id})
    user_response = UserResponse(
        id=user["id"], email=user["email"], full_name=user["full_name"],
        phone=user["phone"], is_admin=user["is_admin"], created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"]})
    user_response = UserResponse(
        id=user["id"], email=user["email"], full_name=user["full_name"],
        phone=user.get("phone"), is_admin=user.get("is_admin", False), created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"], email=current_user["email"], full_name=current_user["full_name"],
        phone=current_user.get("phone"), is_admin=current_user.get("is_admin", False),
        created_at=current_user["created_at"]
    )

@api_router.post("/auth/admin/login", response_model=TokenResponse)
async def admin_login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    token = create_access_token({"sub": user["id"]})
    user_response = UserResponse(
        id=user["id"], email=user["email"], full_name=user["full_name"],
        phone=user.get("phone"), is_admin=True, created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products")
async def get_products(
    sport: Optional[str] = None,
    category: Optional[str] = None,
    color: Optional[str] = None,
    size: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    featured: Optional[bool] = None,
    collection: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {}
    if sport: query["sport"] = sport
    if category: query["category"] = category
    if color: query["colors"] = color
    if size: query["sizes"] = size
    if featured is not None: query["featured"] = featured
    if collection: query["collection"] = collection
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price: query["price"]["$gte"] = min_price
        if max_price: query["price"]["$lte"] = max_price
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    return {"products": products, "total": total}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/admin/products")
async def create_product(product: ProductCreate, admin: dict = Depends(get_admin_user)):
    product_id = str(uuid.uuid4())
    product_data = {
        "id": product_id,
        **product.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_data)
    return {"id": product_id, "message": "Product created successfully"}

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated successfully"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}
    
    # Populate product details
    items_with_details = []
    total = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item_total = product["price"] * item["quantity"]
            total += item_total
            items_with_details.append({
                **item,
                "product": product,
                "item_total": item_total
            })
    
    return {"items": items_with_details, "total": total}

@api_router.post("/cart/add")
async def add_to_cart(item: AddToCart, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    cart_item = {
        "product_id": item.product_id,
        "quantity": item.quantity,
        "size": item.size,
        "color": item.color
    }
    
    if cart:
        # Check if item exists
        existing_idx = None
        for idx, ci in enumerate(cart.get("items", [])):
            if ci["product_id"] == item.product_id and ci["size"] == item.size and ci["color"] == item.color:
                existing_idx = idx
                break
        
        if existing_idx is not None:
            await db.carts.update_one(
                {"user_id": current_user["id"]},
                {"$inc": {f"items.{existing_idx}.quantity": item.quantity}}
            )
        else:
            await db.carts.update_one(
                {"user_id": current_user["id"]},
                {"$push": {"items": cart_item}}
            )
    else:
        await db.carts.insert_one({
            "user_id": current_user["id"],
            "items": [cart_item],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "Item added to cart"}

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    for idx, ci in enumerate(cart.get("items", [])):
        if ci["product_id"] == item.product_id and ci["size"] == item.size and ci["color"] == item.color:
            if item.quantity <= 0:
                await db.carts.update_one(
                    {"user_id": current_user["id"]},
                    {"$pull": {"items": {"product_id": item.product_id, "size": item.size, "color": item.color}}}
                )
            else:
                await db.carts.update_one(
                    {"user_id": current_user["id"]},
                    {"$set": {f"items.{idx}.quantity": item.quantity}}
                )
            return {"message": "Cart updated"}
    
    raise HTTPException(status_code=404, detail="Item not found in cart")

@api_router.delete("/cart/clear")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    await db.carts.delete_one({"user_id": current_user["id"]})
    return {"message": "Cart cleared"}

# ==================== WISHLIST ROUTES ====================

@api_router.get("/wishlist")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    wishlist_ids = current_user.get("wishlist", [])
    products = await db.products.find({"id": {"$in": wishlist_ids}}, {"_id": 0}).to_list(100)
    return {"items": products}

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$addToSet": {"wishlist": product_id}}
    )
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$pull": {"wishlist": product_id}}
    )
    return {"message": "Removed from wishlist"}

# ==================== ORDER & PAYMENT ROUTES ====================

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    # Calculate total
    total = 0
    order_items = []
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        item_total = product["price"] * item.quantity
        total += item_total
        order_items.append({
            **item.model_dump(),
            "product_name": product["name"],
            "product_image": product["images"][0] if product["images"] else None,
            "unit_price": product["price"],
            "item_total": item_total
        })
    
    order_id = str(uuid.uuid4())
    reference = f"GSP-{uuid.uuid4().hex[:8].upper()}"
    
    order = {
        "id": order_id,
        "reference": reference,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "items": order_items,
        "shipping_address": order_data.shipping_address.model_dump(),
        "payment_method": order_data.payment_method,
        "subtotal": total,
        "shipping_fee": 0,
        "total": total,
        "status": "pending",
        "payment_status": "pending",
        "notes": order_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order)
    
    # Clear user's cart
    await db.carts.delete_one({"user_id": current_user["id"]})
    
    # Generate payment info based on method
    payment_info = {}
    if order_data.payment_method == "paystack":
        # Initialize Paystack transaction
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.paystack.co/transaction/initialize",
                    json={
                        "email": current_user["email"],
                        "amount": int(total * 100),  # Convert to kobo
                        "reference": reference,
                        "callback_url": f"{os.environ.get('FRONTEND_URL', '')}/checkout/verify"
                    },
                    headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"}
                )
                paystack_data = response.json()
                if paystack_data.get("status"):
                    payment_info = {
                        "authorization_url": paystack_data["data"]["authorization_url"],
                        "access_code": paystack_data["data"]["access_code"],
                        "reference": reference
                    }
        except Exception as e:
            logger.error(f"Paystack error: {e}")
            payment_info = {"error": "Failed to initialize payment"}
    
    elif order_data.payment_method.startswith("crypto_"):
        crypto_type = order_data.payment_method.replace("crypto_", "")
        wallet_map = {"btc": "btc", "eth": "eth", "usdt": "usdt_trc20", "usdc": "usdc_erc20"}
        wallet_key = wallet_map.get(crypto_type, crypto_type)
        payment_info = {
            "wallet_address": CRYPTO_WALLETS.get(wallet_key, ""),
            "crypto_type": crypto_type.upper(),
            "amount_ngn": total,
            "reference": reference
        }
    
    elif order_data.payment_method == "bank_transfer":
        payment_info = {
            **BANK_DETAILS,
            "amount": total,
            "reference": reference
        }
    
    # Send order confirmation email (non-blocking)
    asyncio.create_task(send_order_confirmation_email(order, current_user["email"]))
    
    # Check and update inventory, send low stock alerts
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if product:
            new_stock = product.get("stock", 0) - item.quantity
            await db.products.update_one(
                {"id": item.product_id},
                {"$set": {"stock": max(0, new_stock)}}
            )
            # Send low stock alert if below threshold
            if new_stock <= LOW_STOCK_THRESHOLD and new_stock > 0:
                asyncio.create_task(send_low_stock_alert({**product, "stock": new_stock}))
    
    return {
        "order_id": order_id,
        "reference": reference,
        "total": total,
        "payment_method": order_data.payment_method,
        "payment_info": payment_info
    }

@api_router.get("/orders")
async def get_user_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": current_user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.post("/payments/verify")
async def verify_payment(data: PaymentVerify, current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.paystack.co/transaction/verify/{data.reference}",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"}
            )
            paystack_data = response.json()
            
            if paystack_data.get("status") and paystack_data["data"]["status"] == "success":
                await db.orders.update_one(
                    {"id": data.order_id},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "confirmed",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                return {"status": "success", "message": "Payment verified"}
            else:
                return {"status": "failed", "message": "Payment verification failed"}
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(status_code=500, detail="Payment verification failed")

@api_router.post("/payments/webhook")
async def paystack_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")
    
    # Verify signature
    expected = hmac.new(PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()
    if signature != expected:
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = await request.json()
    event = payload.get("event")
    data = payload.get("data", {})
    
    if event == "charge.success":
        reference = data.get("reference")
        await db.orders.update_one(
            {"reference": reference},
            {"$set": {
                "payment_status": "paid",
                "status": "confirmed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return {"status": "ok"}

@api_router.get("/crypto/rates")
async def get_crypto_rates():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": "bitcoin,ethereum,tether,usd-coin",
                    "vs_currencies": "ngn",
                    "x_cg_demo_api_key": COINGECKO_API_KEY
                }
            )
            return response.json()
    except Exception as e:
        logger.error(f"CoinGecko error: {e}")
        return {
            "bitcoin": {"ngn": 150000000},
            "ethereum": {"ngn": 6000000},
            "tether": {"ngn": 1600},
            "usd-coin": {"ngn": 1600}
        }

@api_router.get("/payment-methods")
async def get_payment_methods():
    return {
        "methods": [
            {"id": "paystack", "name": "Card Payment (Paystack)", "icon": "credit-card"},
            {"id": "crypto_btc", "name": "Bitcoin (BTC)", "icon": "bitcoin"},
            {"id": "crypto_eth", "name": "Ethereum (ETH)", "icon": "ethereum"},
            {"id": "crypto_usdt", "name": "USDT (TRC20)", "icon": "dollar"},
            {"id": "crypto_usdc", "name": "USDC (ERC20)", "icon": "dollar"},
            {"id": "bank_transfer", "name": "Bank Transfer", "icon": "building"}
        ],
        "crypto_wallets": CRYPTO_WALLETS,
        "bank_details": BANK_DETAILS
    }

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/orders")
async def admin_get_orders(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if status: query["status"] = status
    if payment_status: query["payment_status"] = payment_status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    return {"orders": orders, "total": total}

@api_router.put("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, update: OrderStatusUpdate, admin: dict = Depends(get_admin_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {
        "status": update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add tracking info if provided
    tracking_info = {}
    if update.tracking_number:
        tracking_info["tracking_number"] = update.tracking_number
        update_data["tracking_number"] = update.tracking_number
    if update.tracking_url:
        tracking_info["tracking_url"] = update.tracking_url
        update_data["tracking_url"] = update.tracking_url
    if update.carrier:
        tracking_info["carrier"] = update.carrier
        update_data["carrier"] = update.carrier
    
    # Add tracking history
    tracking_event = {
        "status": update.status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "description": update.notes or f"Order status updated to {update.status}"
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": update_data,
            "$push": {"tracking_history": tracking_event}
        }
    )
    
    # Send shipping update email if status changed to shipped or delivered
    if update.status in ["shipped", "delivered", "out_for_delivery"]:
        updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        asyncio.create_task(send_shipping_update_email(updated_order, order["user_email"], tracking_info))
    
    return {"message": "Order updated"}

@api_router.get("/orders/{order_id}/tracking")
async def get_order_tracking(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one(
        {"id": order_id, "user_id": current_user["id"]},
        {"_id": 0, "tracking_history": 1, "tracking_number": 1, "tracking_url": 1, "carrier": 1, "status": 1}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/admin/customers")
async def admin_get_customers(limit: int = 50, skip: int = 0, admin: dict = Depends(get_admin_user)):
    customers = await db.users.find({"is_admin": {"$ne": True}}, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({"is_admin": {"$ne": True}})
    return {"customers": customers, "total": total}

@api_router.get("/admin/analytics")
async def admin_analytics(admin: dict = Depends(get_admin_user)):
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    confirmed_orders = await db.orders.count_documents({"status": "confirmed"})
    
    # Revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    total_products = await db.products.count_documents({})
    total_customers = await db.users.count_documents({"is_admin": {"$ne": True}})
    
    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "total_revenue": total_revenue,
        "total_products": total_products,
        "total_customers": total_customers,
        "recent_orders": recent_orders
    }

@api_router.get("/admin/settings/theme")
async def get_theme_settings(admin: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({"type": "theme"}, {"_id": 0})
    return settings or {"primary_color": "#050505", "accent_color": "#CCFF00", "secondary_color": "#FFFFFF"}

@api_router.put("/admin/settings/theme")
async def update_theme_settings(theme: ThemeSettings, admin: dict = Depends(get_admin_user)):
    await db.settings.update_one(
        {"type": "theme"},
        {"$set": {**theme.model_dump(), "type": "theme"}},
        upsert=True
    )
    return {"message": "Theme updated"}

# ==================== REVIEWS & RATINGS ====================

@api_router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user already reviewed this product
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    review_id = str(uuid.uuid4())
    review_data = {
        "id": review_id,
        "product_id": product_id,
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "verified_purchase": False,  # Could check order history
        "helpful_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if user purchased this product
    user_orders = await db.orders.find({"user_id": current_user["id"], "payment_status": "paid"}).to_list(100)
    for order in user_orders:
        for item in order.get("items", []):
            if item.get("product_id") == product_id:
                review_data["verified_purchase"] = True
                break
    
    await db.reviews.insert_one(review_data)
    
    # Update product average rating
    await update_product_rating(product_id)
    
    return {"id": review_id, "message": "Review submitted successfully"}

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str, limit: int = 20, skip: int = 0):
    reviews = await db.reviews.find(
        {"product_id": product_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.reviews.count_documents({"product_id": product_id})
    
    # Get rating distribution
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": "$rating", "count": {"$sum": 1}}}
    ]
    distribution_result = await db.reviews.aggregate(pipeline).to_list(5)
    distribution = {str(i): 0 for i in range(1, 6)}
    for d in distribution_result:
        distribution[str(d["_id"])] = d["count"]
    
    # Get average rating
    avg_pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}}}
    ]
    avg_result = await db.reviews.aggregate(avg_pipeline).to_list(1)
    avg_rating = round(avg_result[0]["avg"], 1) if avg_result else 0
    
    return {
        "reviews": reviews,
        "total": total,
        "average_rating": avg_rating,
        "distribution": distribution
    }

@api_router.post("/reviews/{review_id}/helpful")
async def mark_review_helpful(review_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Marked as helpful"}

async def update_product_rating(product_id: str):
    """Update product's average rating"""
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    if result:
        await db.products.update_one(
            {"id": product_id},
            {"$set": {
                "average_rating": round(result[0]["avg"], 1),
                "review_count": result[0]["count"]
            }}
        )

# ==================== INVENTORY ALERTS ====================

@api_router.get("/admin/inventory/low-stock")
async def get_low_stock_products(admin: dict = Depends(get_admin_user)):
    products = await db.products.find(
        {"stock": {"$lte": LOW_STOCK_THRESHOLD}},
        {"_id": 0}
    ).sort("stock", 1).to_list(50)
    return {"products": products, "threshold": LOW_STOCK_THRESHOLD}

@api_router.put("/admin/inventory/{product_id}")
async def update_inventory(product_id: str, stock: int, admin: dict = Depends(get_admin_user)):
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"stock": stock, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Inventory updated"}

# ==================== CATEGORIES & SPORTS ====================

@api_router.get("/categories")
async def get_categories():
    categories = await db.products.distinct("category")
    return {"categories": categories}

@api_router.get("/sports")
async def get_sports():
    sports = await db.products.distinct("sport")
    return {"sports": sports}

@api_router.get("/collections")
async def get_collections():
    collections = await db.products.distinct("collection")
    return {"collections": [c for c in collections if c]}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@gspremierfitfan.com"})
    if not admin_exists:
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@gspremierfitfan.com",
            "password": get_password_hash("admin123"),
            "full_name": "Admin User",
            "is_admin": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "wishlist": [],
            "addresses": []
        }
        await db.users.insert_one(admin)
    
    # Seed products
    products_count = await db.products.count_documents({})
    if products_count == 0:
        sample_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Elite Performance Jersey",
                "description": "Premium moisture-wicking fabric engineered for peak athletic performance. Features advanced ventilation zones and ergonomic fit.",
                "price": 45000,
                "compare_price": 55000,
                "category": "jerseys",
                "sport": "Football",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "colors": ["Black", "White", "Red"],
                "images": ["https://images.pexels.com/photos/28555936/pexels-photo-28555936.jpeg"],
                "stock": 100,
                "featured": True,
                "collection": "Elite Series",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pro Training Kit",
                "description": "Complete training set with breathable jersey and shorts. Perfect for intense workouts.",
                "price": 65000,
                "compare_price": 80000,
                "category": "kits",
                "sport": "Football",
                "sizes": ["S", "M", "L", "XL"],
                "colors": ["Navy", "Black"],
                "images": ["https://images.pexels.com/photos/9519508/pexels-photo-9519508.jpeg"],
                "stock": 50,
                "featured": True,
                "collection": "Pro Series",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Basketball Performance Tank",
                "description": "Lightweight tank top designed for basketball. Maximum mobility and comfort.",
                "price": 35000,
                "category": "jerseys",
                "sport": "Basketball",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "colors": ["White", "Black", "Yellow"],
                "images": ["https://images.unsplash.com/photo-1515459961680-58267e48ae9e?w=800"],
                "stock": 75,
                "featured": False,
                "collection": "Court Series",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Running Performance Tee",
                "description": "Ultra-light running shirt with reflective details for visibility.",
                "price": 28000,
                "category": "jerseys",
                "sport": "Running",
                "sizes": ["XS", "S", "M", "L", "XL"],
                "colors": ["Neon Green", "Orange", "Black"],
                "images": ["https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800"],
                "stock": 120,
                "featured": True,
                "collection": "Speed Series",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.products.insert_many(sample_products)
    
    return {"message": "Data seeded successfully"}

# Include router and middleware
app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
