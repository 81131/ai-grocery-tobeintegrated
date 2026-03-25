import os
import itertools
import time  # <-- Added this for the retry delay
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# 1. Load both keys safely
api_keys = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2")
]

# Filter out any empty keys (in case one is missing)
valid_keys = [key for key in api_keys if key]

if not valid_keys:
    print("WARNING: No API keys found in .env file!")

# 2. Create a pool of Gemini clients based on the valid keys
clients = [genai.Client(api_key=key) for key in valid_keys]

# 3. Create an infinite round-robin cycle (Client 1 -> Client 2 -> Client 1...)
client_pool = itertools.cycle(clients)

# --- THE MOCK DATABASE ---
MOCK_CATALOG = """
1. Rice - Price: Rs. 200 per kilo. Image URL: https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400
2. Sugar - Price: Rs. 150 per kilo. Image URL: https://spar2u.lk/cdn/shop/files/3009935-1_1.jpg?v=1748383105
3. Dhal - Price: Rs. 300 per kilo. Image URL: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtki1Kgi9pGNtHCen-61DF6GS_QMucWnlrdw&s
4. cappuccino(espresso-based coffee drink) - Price: Rs. 800 per cup. Image URL: https://images.ctfassets.net/0e6jqcgsrcye/6Dnzkf1ylG7IxDRG9Ez1Ia/0db4f0be1ff6199ae89afa4a0ae26687/How_to_make_a_perfect_cappuccino_at_home.jpg
5. Milk Powder - Price: Rs. 1200 per 400g. Image URL: https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400
6. Eggs - Price: Rs. 50 per piece. Image URL: https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400
7. Bread - Price: Rs. 150 per loaf. Image URL: https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400
8. Tea Leaves - Price: Rs. 400 per 200g. Image URL: https://images.unsplash.com/photo-1576092762791-dd9e2220afa1?w=400
9. Red Onions - Price: Rs. 350 per kilo. Image URL: https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400
10.Potatoes - Price: Rs. 250 per kilo. Image URL: https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400
11.Coconut Oil - Price: Rs. 600 per liter. Image URL: https://images.unsplash.com/photo-1620021603522-8ebfc3528b8a?w=400
12.Coconut - Price: Rs. 100 per piece. Image URL: https://images.unsplash.com/photo-1526344966-89049886b28d?w=400
13.Wheat Flour - Price: Rs. 180 per kilo. Image URL: https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400
14.Chicken - Price: Rs. 1200 per kilo. Image URL: https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400
15.Canned Fish (Mackerel) - Price: Rs. 650 per tin. Image URL: https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=400
16.Salt - Price: Rs. 80 per kilo. Image URL: https://images.unsplash.com/photo-1628042525642-1e9de49eb2db?w=400
17.Chili Powder - Price: Rs. 500 per 200g. Image URL: https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400
18.Garlic - Price: Rs. 600 per kilo. Image URL: https://images.unsplash.com/photo-1615486171448-4fdcb979b9bc?w=400
19.Bananas - Price: Rs. 250 per kilo. Image URL: https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=400
20.Butter - Price: Rs. 850 per 200g. Image URL: https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400
"""

# 4. Define our smarter store rules
SYSTEM_PROMPT = f"""
You are a friendly and helpful AI assistant for Ransara Supermarket.

Here is the current product catalog:
{MOCK_CATALOG}

YOUR RULES:
1. BROWSING: If the user asks about a product in the catalog (e.g., "Do you have sugar?"), tell them the price and include the image using this exact format on its own line: [IMAGE: url_here]
2. OUT OF STOCK: If the user asks for a grocery item NOT in the catalog (like Coffee or Milk), politely apologize and say we don't carry that item right now. Do NOT use the fallback error message for this.
3. ORDERING: If the user explicitly asks to order an item, calculate the total. Reply with the price, total price, and the image [IMAGE: url_here]. Then ask: "Would you like to proceed to payment?"
4. CONFIRMATION: If the user says "Yes" or confirms an order, you MUST put [PAYMENT_TRIGGER] at the very end of your reply.
5. OFF-TOPIC: ONLY if the user asks about completely unrelated topics (like cars, politics, or coding), reply EXACTLY with: "I can only help with supermarket related questions."
"""

# --- NEW: Auto-Retry Logic Added Here ---
def generate_ai_response(message: str) -> str:
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            # Get the next available client from the rotating pool
            current_client = next(client_pool)

            response = current_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=message,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3,
                )
            )
            return response.text
            
        except Exception as e:
            error_msg = str(e)
            # If Google is busy (503) and we haven't run out of retries, wait and try again
            if "503" in error_msg and attempt < (max_retries - 1):
                print(f"Google servers busy. Retrying in 2 seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(2)
                continue # Loops back to the top and tries again
            
            # If it's a different error, or we failed 3 times, show the fallback message
            print(f"Gemini API Error: {e}")
            return "Sorry, I am having trouble connecting to my brain right now. My brain isn't braining....."