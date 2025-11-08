#!/usr/bin/env python3
"""
Configuration Manager Usage Examples

This script demonstrates how to use the ConfigManager class
for managing application configuration.
"""

from config_manager import ConfigManager, config_manager
from pathlib import Path
import time


def example_1_basic_usage():
    """Example 1: Basic configuration usage"""
    print("\n" + "="*80)
    print("Example 1: Basic Configuration Usage")
    print("="*80)

    # Get individual config values
    db_host = config_manager.get("DB_HOST")
    redis_port = config_manager.get("REDIS_PORT")

    print(f"Database Host: {db_host}")
    print(f"Redis Port: {redis_port}")

    # Get connection URLs
    print(f"\nDatabase URL: {config_manager.database_url}")
    print(f"Redis URL: {config_manager.redis_url}")


def example_2_get_all_config():
    """Example 2: Get all configuration (with secrets hidden)"""
    print("\n" + "="*80)
    print("Example 2: Get All Configuration")
    print("="*80)

    # Get all config with secrets hidden
    all_config = config_manager.get_all(hide_secrets=True)

    print(f"Total configuration variables: {len(all_config)}")
    print("\nSample configuration:")
    for key, value in list(all_config.items())[:10]:
        print(f"  {key}: {value}")


def example_3_get_by_category():
    """Example 3: Get configuration by category"""
    print("\n" + "="*80)
    print("Example 3: Get Configuration by Category")
    print("="*80)

    categories = ["database", "redis", "scrapers"]

    for category in categories:
        config = config_manager.get_by_category(category, hide_secrets=True)
        print(f"\n{category.upper()} Configuration:")
        for key, value in config.items():
            print(f"  {key}: {value}")


def example_4_status_and_validation():
    """Example 4: Check configuration status and validation"""
    print("\n" + "="*80)
    print("Example 4: Configuration Status and Validation")
    print("="*80)

    # Get status
    status = config_manager.get_status()
    print("\nConfiguration Status:")
    print(f"  Loaded: {status['loaded']}")
    print(f"  Sources: {', '.join(status['sources'])}")
    print(f"  Total Variables: {status['total_variables']}")
    print(f"  Missing Required: {len(status['missing_required'])}")
    print(f"  Missing Optional: {len(status['missing_optional'])}")

    if status['missing_required']:
        print(f"\n  ⚠️  Missing Required Variables:")
        for var in status['missing_required']:
            print(f"    - {var}")

    if status['missing_optional']:
        print(f"\n  ℹ️  Missing Optional Variables:")
        for var in status['missing_optional'][:5]:  # Show first 5
            print(f"    - {var}")

    # Validate configuration
    validation = config_manager.validate_config()
    print(f"\nConfiguration Valid: {'✅ Yes' if validation['valid'] else '❌ No'}")
    print(f"\nValidation Summary:")
    print(f"  Total: {validation['summary']['total']}")
    print(f"  Configured: {validation['summary']['configured']}")
    print(f"  Missing Required: {validation['summary']['missing_required']}")
    print(f"  Missing Optional: {validation['summary']['missing_optional']}")


def example_5_reload_config():
    """Example 5: Reload configuration"""
    print("\n" + "="*80)
    print("Example 5: Reload Configuration")
    print("="*80)

    print("Initial load time:", config_manager.status.last_reload)

    # Wait a moment
    time.sleep(1)

    # Reload configuration
    print("\nReloading configuration...")
    success = config_manager.reload()

    print(f"Reload successful: {success}")
    print(f"New load time: {config_manager.status.last_reload}")


def example_6_hot_reload():
    """Example 6: Hot-reload with file watching"""
    print("\n" + "="*80)
    print("Example 6: Hot-Reload with File Watching")
    print("="*80)

    # Create a custom config manager with watching enabled
    manager = ConfigManager(auto_load=True, watch=True)

    # Add a listener for configuration changes
    def on_config_change(config):
        print("\n🔄 Configuration changed!")
        print(f"  Total variables: {len(config)}")
        print(f"  Timestamp: {manager.status.last_reload}")

    manager.add_listener(on_config_change)

    print("File watching enabled")
    print("The configuration will automatically reload when .env or config.yaml changes")
    print("\nTo test:")
    print("1. Edit your .env file")
    print("2. Save the file")
    print("3. Watch the console for automatic reload notification")
    print("\nPress Ctrl+C to stop watching...")

    try:
        # Watch for 30 seconds
        for i in range(30):
            time.sleep(1)
            if i % 10 == 0:
                print(f"  Still watching... ({30-i}s remaining)")
    except KeyboardInterrupt:
        print("\nStopped by user")
    finally:
        manager.stop_watching()
        print("File watching stopped")


def example_7_custom_config():
    """Example 7: Create custom configuration manager"""
    print("\n" + "="*80)
    print("Example 7: Custom Configuration Manager")
    print("="*80)

    # Create a custom config manager with specific settings
    custom_manager = ConfigManager(
        base_path=Path(__file__).parent.parent,
        auto_load=True,
        watch=False
    )

    print("Custom ConfigManager created")
    print(f"Base path: {custom_manager.base_path}")
    print(f"Loaded: {custom_manager.status.loaded}")
    print(f"Total variables: {len(custom_manager.config)}")


def example_8_categories_validation():
    """Example 8: Validate configuration by category"""
    print("\n" + "="*80)
    print("Example 8: Category Validation")
    print("="*80)

    validation = config_manager.validate_config()

    print("\nCategory Validation Results:")
    for category, results in validation['categories'].items():
        status_icon = "✅" if results['valid'] else "❌"
        print(f"\n  {status_icon} {category.upper()}")
        print(f"    Total: {results['total']}")
        print(f"    Configured: {results['configured']}")
        print(f"    Required: {results['required']}")
        print(f"    Required Configured: {results['required_configured']}")


def main():
    """Run all examples"""
    print("\n" + "="*80)
    print("ConfigManager Usage Examples")
    print("="*80)

    examples = [
        example_1_basic_usage,
        example_2_get_all_config,
        example_3_get_by_category,
        example_4_status_and_validation,
        example_5_reload_config,
        example_8_categories_validation,
        example_7_custom_config,
    ]

    for example in examples:
        try:
            example()
        except Exception as e:
            print(f"\n❌ Error in {example.__name__}: {e}")

    # Optional: Run hot-reload example (commented out by default)
    # print("\n" + "="*80)
    # print("Optional: Hot-Reload Example")
    # print("="*80)
    # run_hot_reload = input("Run hot-reload example? (y/n): ").lower() == 'y'
    # if run_hot_reload:
    #     example_6_hot_reload()

    print("\n" + "="*80)
    print("All examples completed!")
    print("="*80)


if __name__ == "__main__":
    main()
