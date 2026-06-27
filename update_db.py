import re

with open('Database_PostgreLatest.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_cards = False
in_sessions = False

card_statuses = {}
for i in range(1, 151):
    card_statuses[f'{i:03d}'] = 'ACTIVE'
card_statuses['LOST-01'] = 'LOST'
card_statuses['LOST-02'] = 'LOST'

session_card_idx = 1
for i in range(len(lines)):
    line = lines[i]
    
    if 'INSERT INTO ParkingCards' in line:
        in_cards = True
        new_lines.append(line)
        continue
    
    if in_cards:
        if ';' in line:
            in_cards = False
            new_lines.append('__CARDS_PLACEHOLDER__\n')
        continue
        
    if 'INSERT INTO ParkingSessions' in line:
        in_sessions = True
        new_lines.append(line)
        continue
        
    if in_sessions:
        if line.strip() == '' or line.startswith('--'):
            in_sessions = False
            new_lines.append(line)
            continue
            
        match = re.match(r'^\((\d+),\s*(\d+),\s*(\d+),\s*([^,]+),\s*(.*)', line)
        if match:
            sess_id, veh_id, slot_id, old_card, rest = match.groups()
            
            card_id = f'{session_card_idx:03d}'
            session_card_idx += 1
            
            if "'PARKING'" in rest or "'UNPAID'" in rest or "'VIOLATION'" in rest:
                card_statuses[card_id] = 'IN_USE'
            elif "'LOST_TICKET'" in rest:
                card_statuses[card_id] = 'LOST'
            
            new_line = f"({sess_id}, {veh_id}, {slot_id}, '{card_id}', {rest}\n"
            new_lines.append(new_line)
            if ';' in rest:
                in_sessions = False
            continue
            
    new_lines.append(line)

cards_str_list = []
for cid, status in card_statuses.items():
    cards_str_list.append(f"('{cid}', '{status}')")
cards_str = ",\n".join(cards_str_list) + ";"

final_lines = []
for line in new_lines:
    if line == '__CARDS_PLACEHOLDER__\n':
        final_lines.append(cards_str + '\n')
    else:
        final_lines.append(line)

with open('Database_PostgreLatest.sql', 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print(f"Updated SQL. Next Card IDX: {session_card_idx}")
