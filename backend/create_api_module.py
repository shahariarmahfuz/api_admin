#!/usr/bin/env python3
"""
Orvia API Module Generator CLI
Usage: python create_api_module.py <module_name>
Example: python create_api_module.py audio
"""
import sys
import shutil
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Usage: python create_api_module.py <module_name>")
        sys.exit(1)

    module_name = sys.argv[1].lower().strip().replace("-", "_")
    base_dir = Path(__file__).parent
    template_dir = base_dir / "app" / "templates" / "api_module_template"
    target_dir = base_dir / "app" / "api" / "v1" / module_name

    if target_dir.exists():
        print(f"Error: Module directory '{target_dir}' already exists.")
        sys.exit(1)

    shutil.copytree(template_dir, target_dir)

    # Replace placeholders in copied files
    for file_path in target_dir.rglob("*.py"):
        content = file_path.read_text(encoding="utf-8")
        content = content.replace("example", module_name)
        content = content.replace("Example", module_name.capitalize())
        file_path.write_text(content, encoding="utf-8")

    # Rename test file
    test_src = target_dir / "tests" / "test_module.py"
    if test_src.exists():
        test_src.rename(target_dir / "tests" / f"test_{module_name}.py")

    print(f"✅ Successfully created new API module at: {target_dir}")
    print("\nNext steps to enable:")
    print(f"1. In app/api/v1/router.py add:")
    print(f"   from app.api.v1.{module_name}.router import router as {module_name}_router")
    print(f"   api_v1_router.include_router({module_name}_router)")
    print(f"2. Add your custom schemas and services in {target_dir}")

if __name__ == "__main__":
    main()
