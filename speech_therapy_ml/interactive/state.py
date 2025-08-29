# interactive/state.py
"""
Small exercise set used by the guided interactive mode.
Each exercise is a dict: {'id', 'prompt_text', 'expected_text', 'duration_s'}
- prompt_text: what the assistant will say (human-friendly)
- expected_text: canonical expected phrase used by the scorer
- duration_s: how long to record the user's attempt (terminal demo)
"""

EXERCISES = [
    # --- Fluency Drills ---
    {"id": 1, "type": "fluency", "prompt_text": "Say slowly: 'I am speaking clearly.'", 
     "expected_text": "I am speaking clearly", "duration_s": 3},

    {"id": 2, "type": "fluency", "prompt_text": "Repeat this with correct pronounciation: 'pa  ta  ka'", 
     "expected_text": "pa ta ka", "duration_s": 2},

    {"id": 3, "type": "fluency", "prompt_text": "Say this at a steady pace: 'Today is a good day.'", 
     "expected_text": "Today is a good day", "duration_s": 4},

    # --- Everyday Phrases ---
    {"id": 4, "type": "daily", "prompt_text": "Please say: 'Good morning, how are you?'", 
     "expected_text": "Good morning how are you", "duration_s": 4},

    {"id": 5, "type": "daily", "prompt_text": "Say: 'Can I have a glass of water, please?'", 
     "expected_text": "Can I have a glass of water please", "duration_s": 5},

    {"id": 6, "type": "daily", "prompt_text": "Say: 'Thank you very much for your help.'", 
     "expected_text": "Thank you very much for your help", "duration_s": 5},

    # --- Minimal Pairs (sound contrast practice) ---
    {"id": 7, "type": "minimal_pair", "prompt_text": "Say clearly: 'ship' and 'sheep'", 
     "expected_text": "ship sheep", "duration_s": 3},

    {"id": 8, "type": "minimal_pair", "prompt_text": "Say clearly: 'cat' and 'cut'", 
     "expected_text": "cat cut", "duration_s": 3},

    {"id": 9, "type": "minimal_pair", "prompt_text": "Say clearly: 'pen' and 'pan'", 
     "expected_text": "pen pan", "duration_s": 3},

    # --- Connected Speech ---
    {"id": 10, "type": "sentence", "prompt_text": "Say: 'The sun is shining and I feel happy today.'", 
     "expected_text": "The sun is shining and I feel happy today", "duration_s": 6},

    {"id": 11, "type": "sentence", "prompt_text": "Say: 'I would like to order a cup of coffee.'", 
     "expected_text": "I would like to order a cup of coffee", "duration_s": 5},

    {"id": 12, "type": "sentence", "prompt_text": "Say: 'It is nice to meet you, have a great day.'", 
     "expected_text": "It is nice to meet you have a great day", "duration_s": 6},
]


