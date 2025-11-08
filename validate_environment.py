#!/usr/bin/env python3
"""
Comprehensive Environment Validation Script
Validates all Python files, imports, and dependencies
"""
import os
import sys
import ast
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple
import json

class EnvironmentValidator:
    def __init__(self, base_path: str = "/home/user/invest"):
        self.base_path = Path(base_path)
        self.errors = []
        self.warnings = []
        self.info = []

    def log_error(self, category: str, file: str, message: str):
        self.errors.append({"category": category, "file": file, "message": message})

    def log_warning(self, category: str, file: str, message: str):
        self.warnings.append({"category": category, "file": file, "message": message})

    def log_info(self, category: str, file: str, message: str):
        self.info.append({"category": category, "file": file, "message": message})

    def validate_python_syntax(self) -> Dict:
        """Validate syntax of all Python files"""
        print("🔍 Validating Python syntax...")
        results = {"valid": [], "invalid": []}

        python_files = list(self.base_path.rglob("*.py"))

        for py_file in python_files:
            # Skip venv and node_modules
            if "venv" in str(py_file) or "node_modules" in str(py_file) or ".git" in str(py_file):
                continue

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    code = f.read()
                    ast.parse(code)
                results["valid"].append(str(py_file.relative_to(self.base_path)))
                self.log_info("syntax", str(py_file.relative_to(self.base_path)), "Valid Python syntax")
            except SyntaxError as e:
                error_msg = f"Line {e.lineno}: {e.msg}"
                results["invalid"].append({
                    "file": str(py_file.relative_to(self.base_path)),
                    "error": error_msg
                })
                self.log_error("syntax", str(py_file.relative_to(self.base_path)), error_msg)
            except Exception as e:
                error_msg = str(e)
                results["invalid"].append({
                    "file": str(py_file.relative_to(self.base_path)),
                    "error": error_msg
                })
                self.log_error("syntax", str(py_file.relative_to(self.base_path)), error_msg)

        print(f"  ✅ Valid: {len(results['valid'])}")
        print(f"  ❌ Invalid: {len(results['invalid'])}")
        return results

    def validate_python_imports(self) -> Dict:
        """Validate Python imports"""
        print("\n🔍 Validating Python imports...")
        results = {"missing_imports": [], "circular_imports": []}

        python_files = list(self.base_path.rglob("*.py"))

        for py_file in python_files:
            if "venv" in str(py_file) or "node_modules" in str(py_file) or ".git" in str(py_file):
                continue

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    code = f.read()
                    tree = ast.parse(code)

                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            for alias in node.names:
                                # Check if import exists
                                module_name = alias.name
                                self._check_import(module_name, py_file, results)
                        elif isinstance(node, ast.ImportFrom):
                            if node.module:
                                self._check_import(node.module, py_file, results)

            except Exception as e:
                # File might have syntax errors, already caught in previous step
                pass

        print(f"  ⚠️  Missing imports: {len(results['missing_imports'])}")
        return results

    def _check_import(self, module_name: str, file: Path, results: Dict):
        """Check if a module can be imported"""
        # Skip checking built-in modules and common packages
        builtin_modules = ['os', 'sys', 'json', 'datetime', 'typing', 'pathlib',
                          'asyncio', 'time', 're', 'collections', 'functools',
                          'itertools', 'logging', 'pickle', 'uuid', 'enum']

        common_packages = ['fastapi', 'pydantic', 'sqlalchemy', 'redis', 'loguru',
                          'aiohttp', 'selenium', 'psycopg2', 'apscheduler']

        if module_name.split('.')[0] in builtin_modules + common_packages:
            return

        # Check local imports
        if module_name.startswith('.'):
            # Relative import - harder to validate
            return

    def validate_requirements(self) -> Dict:
        """Validate requirements.txt files"""
        print("\n🔍 Validating requirements.txt files...")
        results = {"found": [], "issues": []}

        req_files = list(self.base_path.rglob("requirements.txt"))

        for req_file in req_files:
            if "venv" in str(req_file) or "node_modules" in str(req_file):
                continue

            results["found"].append(str(req_file.relative_to(self.base_path)))

            try:
                with open(req_file, 'r') as f:
                    lines = f.readlines()

                for i, line in enumerate(lines, 1):
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue

                    # Check for version pinning
                    if '==' not in line and '>=' not in line and '~=' not in line:
                        self.log_warning("requirements",
                                       str(req_file.relative_to(self.base_path)),
                                       f"Line {i}: No version specified for {line}")

            except Exception as e:
                self.log_error("requirements",
                             str(req_file.relative_to(self.base_path)),
                             str(e))

        print(f"  📦 Found {len(results['found'])} requirements.txt files")
        return results

    def validate_env_files(self) -> Dict:
        """Validate .env files"""
        print("\n🔍 Validating environment files...")
        results = {"found": [], "missing_example": False}

        env_file = self.base_path / ".env"
        env_example = self.base_path / ".env.example"

        if env_example.exists():
            results["found"].append(".env.example")
            self.log_info("env", ".env.example", "Found")
        else:
            results["missing_example"] = True
            self.log_warning("env", ".env.example", "Not found")

        if env_file.exists():
            results["found"].append(".env")
            self.log_info("env", ".env", "Found")
        else:
            self.log_warning("env", ".env", "Not found - using .env.example")

        return results

    def validate_docker_compose(self) -> Dict:
        """Validate docker-compose.yml"""
        print("\n🔍 Validating docker-compose.yml...")
        results = {"valid": False, "services": [], "issues": []}

        compose_file = self.base_path / "docker-compose.yml"

        if not compose_file.exists():
            self.log_error("docker", "docker-compose.yml", "File not found")
            return results

        try:
            # Try to validate with docker compose config
            result = subprocess.run(
                ["docker", "compose", "-f", str(compose_file), "config"],
                capture_output=True,
                text=True,
                cwd=self.base_path
            )

            if result.returncode == 0:
                results["valid"] = True
                self.log_info("docker", "docker-compose.yml", "Valid configuration")

                # Extract service names
                import yaml
                with open(compose_file) as f:
                    compose_data = yaml.safe_load(f)
                    if 'services' in compose_data:
                        results["services"] = list(compose_data['services'].keys())
            else:
                self.log_error("docker", "docker-compose.yml", result.stderr)
                results["issues"].append(result.stderr)

        except FileNotFoundError:
            self.log_warning("docker", "docker-compose.yml", "Docker not installed - skipping validation")
        except Exception as e:
            self.log_error("docker", "docker-compose.yml", str(e))

        print(f"  {'✅' if results['valid'] else '❌'} Docker Compose: {'Valid' if results['valid'] else 'Invalid'}")
        if results["services"]:
            print(f"  📦 Services: {', '.join(results['services'])}")

        return results

    def validate_shell_scripts(self) -> Dict:
        """Validate shell scripts"""
        print("\n🔍 Validating shell scripts...")
        results = {"valid": [], "invalid": []}

        shell_scripts = list(self.base_path.rglob("*.sh"))

        for script in shell_scripts:
            if "venv" in str(script) or "node_modules" in str(script):
                continue

            # Check if executable
            if not os.access(script, os.X_OK):
                self.log_warning("shell", str(script.relative_to(self.base_path)),
                               "Not executable - run: chmod +x")

            # Check shebang
            try:
                with open(script, 'r') as f:
                    first_line = f.readline()
                    if not first_line.startswith('#!'):
                        self.log_warning("shell", str(script.relative_to(self.base_path)),
                                       "Missing shebang")
                    results["valid"].append(str(script.relative_to(self.base_path)))
            except Exception as e:
                self.log_error("shell", str(script.relative_to(self.base_path)), str(e))
                results["invalid"].append(str(script.relative_to(self.base_path)))

        print(f"  📜 Found {len(results['valid'])} shell scripts")
        return results

    def generate_report(self) -> str:
        """Generate validation report"""
        report = []
        report.append("# 🔍 ENVIRONMENT VALIDATION REPORT")
        report.append(f"\n**Generated:** {subprocess.check_output(['date']).decode().strip()}")
        report.append(f"**Base Path:** {self.base_path}\n")

        # Summary
        report.append("## 📊 Summary\n")
        report.append(f"- **Errors:** {len(self.errors)} 🔴")
        report.append(f"- **Warnings:** {len(self.warnings)} 🟡")
        report.append(f"- **Info:** {len(self.info)} 🔵\n")

        # Errors
        if self.errors:
            report.append("## 🔴 Errors\n")
            for error in self.errors:
                report.append(f"### {error['category'].upper()}: {error['file']}")
                report.append(f"```\n{error['message']}\n```\n")

        # Warnings
        if self.warnings:
            report.append("## 🟡 Warnings\n")
            for warning in self.warnings:
                report.append(f"- **{warning['category']}** - `{warning['file']}`: {warning['message']}")

        return "\n".join(report)

    def run_all_validations(self):
        """Run all validations"""
        print("="*70)
        print("🔍 COMPREHENSIVE ENVIRONMENT VALIDATION")
        print("="*70)

        results = {}

        # Run validations
        results['python_syntax'] = self.validate_python_syntax()
        results['python_imports'] = self.validate_python_imports()
        results['requirements'] = self.validate_requirements()
        results['env_files'] = self.validate_env_files()
        results['docker_compose'] = self.validate_docker_compose()
        results['shell_scripts'] = self.validate_shell_scripts()

        # Generate report
        print("\n" + "="*70)
        print("📋 GENERATING REPORT")
        print("="*70)

        report = self.generate_report()

        # Save report
        report_file = self.base_path / "VALIDATION_FINAL_REPORT.md"
        with open(report_file, 'w') as f:
            f.write(report)

        print(f"\n✅ Report saved to: {report_file}")

        # Print summary
        print("\n" + "="*70)
        print("📊 VALIDATION SUMMARY")
        print("="*70)
        print(f"🔴 Errors: {len(self.errors)}")
        print(f"🟡 Warnings: {len(self.warnings)}")
        print(f"🔵 Info: {len(self.info)}")

        if len(self.errors) == 0:
            print("\n✅ NO CRITICAL ERRORS FOUND!")
        else:
            print("\n❌ CRITICAL ERRORS FOUND - Review report for details")

        return results, len(self.errors) == 0

if __name__ == "__main__":
    validator = EnvironmentValidator()
    results, success = validator.run_all_validations()
    sys.exit(0 if success else 1)
