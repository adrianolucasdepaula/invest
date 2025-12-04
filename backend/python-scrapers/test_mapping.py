"""Test mapping logic"""

label = "EV / EBITDA"
normalized_label = label.lower().strip().replace("?", "")

print(f"Original: '{label}'")
print(f"Normalized: '{normalized_label}'")
print()

field_map = {
    "ev/ebit": "ev_ebit",
    "ev / ebit": "ev_ebit",
    "ev/ebitda": "ev_ebitda",
    "ev / ebitda": "ev_ebitda",
}

print("Testing matching logic:")
for key, field in field_map.items():
    match = key in normalized_label
    print(f"  '{key}' in '{normalized_label}' → {match}")
    if match:
        print(f"  ✅ Would map to: {field}")
        break
else:
    print(f"  ❌ NO MATCH FOUND")
