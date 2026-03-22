import os
import glob

directory = r"c:\Users\Pc-Casa\.gemini\antigravity\scratch\egest\ilovepdf-clone\frontend\app"
files = glob.glob(os.path.join(directory, "**", "*.tsx"), recursive=True)

replacements = {
    "#D4AF37": "#2980f2",
    "#d4af37": "#2980f2",
    "#b8a07e": "#60a5fa",
    "#b76e79": "#3b82f6",
    "bg-pdfred": "bg-[#2980f2]",
    "text-pdfred": "text-[#2980f2]",
    "border-pdfred": "border-[#2980f2]",
    "hover:border-pdfred": "hover:border-[#2980f2]",
    "hover:bg-red-700": "hover:bg-[#2980f2]/90",
    "bg-red-50": "bg-[#2980f2]/5",
    "dark:bg-red-900/20": "dark:bg-[#2980f2]/10",
    "dark:bg-red-900/30": "dark:bg-[#2980f2]/20",
    "border-red-300": "border-[#2980f2]/30",
    "dark:border-red-900/50": "dark:border-[#2980f2]/50",
    "hover:bg-red-50": "hover:bg-[#2980f2]/5",
    "font-serif": "font-sans font-extrabold",
    "text-[#1e1e24]": "text-slate-900",
    "dark:text-[#E8E6E1]": "dark:text-white",
    "text-[#E8E6E1]": "text-white",
    "text-red-300": "text-gray-400",
    "dark:text-red-400": "dark:text-gray-500",
    "bg-[#1e1e24]": "bg-[#1e1e1e]", # just in case
}

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    for pattern, repl in replacements.items():
        new_content = new_content.replace(pattern, repl)
        
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
