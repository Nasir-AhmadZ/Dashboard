#!/usr/bin/env python3
"""
Test script for the alert system.
Appends unsafe behaviors to behavior_log.json every 6 seconds.
"""

import json
import time
from datetime import datetime

LOG_FILE = './public/behavior_log.json'

test_sequence = [
    {'behavior': 'Talking', 'score': -5},
    {'behavior': 'Safe',    'score': 10},
    {'behavior': 'Texting', 'score': -10},
    {'behavior': 'Safe',    'score': 10},
    {'behavior': 'Other',   'score': -2},
    {'behavior': 'Texting', 'score': -10},
]

def append_entry(behavior, score):
    with open(LOG_FILE, 'r') as f:
        data = json.load(f)
    data.append({'behavior': behavior, 'score': score, 'timestamp': datetime.now().isoformat()})
    with open(LOG_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    print(f'Appended: {behavior} (score: {score})')

for entry in test_sequence:
    append_entry(entry['behavior'], entry['score'])
    time.sleep(6)

print('Test complete.')
