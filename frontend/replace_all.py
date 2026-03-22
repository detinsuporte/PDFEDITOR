import os
import glob
import re

directory = r"c:\Users\Pc-Casa\.gemini\antigravity\scratch\egest\ilovepdf-clone\frontend\app"
files = glob.glob(os.path.join(directory, "**", "*.tsx"), recursive=True)

patterns = [
    # Dropzone hover colors
    (r'hover:bg-(purple|orange|green|blue|red)-50\b', r'hover:bg-[#2980f2]/5'),
    (r'dark:hover:bg-(purple|orange|green|blue|red)-900/[0-9]+', r'dark:hover:bg-[#2980f2]/10'),
    (r'bg-(purple|orange|green|blue|red)-50\b', r'bg-[#2980f2]/5'),
    (r'dark:bg-(purple|orange|green|blue|red)-900/[0-9]+', r'dark:bg-[#2980f2]/10'),
    
    # Dropzone border colors
    (r'border-(purple|orange|green|blue|red)-[2345]00\b', r'border-[#2980f2]/50'),
    (r'dark:border-(purple|orange|green|blue|red)-900/[0-9]+', r'dark:border-[#2980f2]/50'),
    (r'hover:border-(purple|orange|green|blue|red)-[45]00\b', r'hover:border-[#2980f2]'),
    
    # Main button colors
    (r'bg-(purple|orange|green|blue|red)-[56]00\b', r'bg-[#2980f2]'),
    (r'hover:bg-(purple|orange|green|blue|red)-[67]00\b', r'hover:bg-[#2980f2]/90'),
    
    # Text colors
    (r'text-(purple|orange|green|blue|red)-[56]00\b', r'text-[#2980f2]'),
    (r'dark:text-(purple|orange|green|blue|red)-[45]00\b', r'dark:text-[#2980f2]'),
    (r'group-hover:text-(purple|orange|green|blue|red)-[56]00\b', r'group-hover:text-[#2980f2]'),
    
    # Icon colors inside dropzones and titles
    (r'text-(purple|orange|green|blue|red)-300\b', r'text-gray-400'),
    
    # Shadows
    (r'shadow-\[0_4px_14px_0_rgba\([0-9]+,[0-9]+,[0-9]+,0.39\)\]', r'shadow-lg')
]

for filepath in files:
    if "ThemeToggle.tsx" in filepath:
        continue
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    for pattern, repl in patterns:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
