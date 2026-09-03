import yaml
from pathlib import Path


def load_rules():
    """
    Load legal rules from the YAML knowledge base.
    """

    current_file = Path(__file__).resolve()

    rules_file = (
        current_file.parent
        / "rules"
        / "legal_metrology_rules.yaml"
    )

    if not rules_file.exists():
        raise FileNotFoundError(
            f"Rules file not found: {rules_file}"
        )

    with open(rules_file, "r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    if not data:
        raise ValueError("Rules YAML file is empty.")

    if "rules" not in data:
        raise ValueError(
            "Invalid YAML structure: 'rules' key is missing."
        )

    return data


if __name__ == "__main__":

    try:
        rule_data = load_rules()

        print("Rules loaded successfully!")
        print()

        print("Rule Set:")
        print(rule_data.get("rule_set"))

        print()

        print("Number of rules:")
        print(len(rule_data["rules"]))

        print()

        for rule in rule_data["rules"]:
            print(
                f"{rule['rule_id']} "
                f"→ {rule['field']} "
                f"→ {rule['legal_provision']}"
            )

    except Exception as error:
        print("Error loading rules:")
        print(error)