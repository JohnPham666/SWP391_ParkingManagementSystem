with open('Database_PostgreLatest.sql', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('C?ng-A', 'C?ng-A')
content = content.replace('C?ng-B', 'C?ng-B')
content = content.replace('C?ng-C', 'C?ng-C')
content = content.replace('C?ng-Q7-A', 'C?ng-Q7-A')
content = content.replace('C?ng-Q7-B', 'C?ng-Q7-B')
content = content.replace('Nhn vin tr?c c?ng', 'Nhân viên tr?c c?ng')
content = content.replace('x? ly', 'x? lý')

with open('Database_PostgreLatest.sql', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed encoding issues.')
