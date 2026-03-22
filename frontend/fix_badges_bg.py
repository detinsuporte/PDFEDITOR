import os
import glob
import re

directory = r"c:\Users\Pc-Casa\.gemini\antigravity\scratch\egest\ilovepdf-clone\frontend\app"
files = glob.glob(os.path.join(directory, "**", "*.tsx"), recursive=True)

patterns = [
    # Remove PrivacyBadge component
    (r'\s*<PrivacyBadge />\s*', r''),
    # Remove PrivacyBadge import
    (r'import PrivacyBadge from "[^"]+";\n?', r''),
    # Remove hardcoded root backgrounds that break standard layout
    (r'bg-\[\#F0F2F5\] dark:bg-\[\#121212\]', r'bg-transparent dark:bg-transparent'),
    # Actually wait, some files might have bg-[#1e1e24]... just remove any hardcoded backgrounds on the min-h-screen wrapper
    (r'min-h-screen bg-\[[^\]]+\] dark:bg-\[[^\]]+\]', r'min-h-screen bg-transparent dark:bg-transparent')
]

for filepath in files:
    if "layout.tsx" in filepath or "ThemeToggle.tsx" in filepath:
        continue # layout.tsx NEEDS the PrivacyBadge! ThemeToggle is safe.
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    for pattern, repl in patterns:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
