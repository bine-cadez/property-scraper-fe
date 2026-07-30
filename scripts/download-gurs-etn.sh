#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: $0 <sales|rent> <year> [output-directory]"
}

if [[ $# -lt 2 || $# -gt 3 ]]; then
  usage
  exit 2
fi

dataset_kind="$1"
dataset_year="$2"
output_directory="${3:-data/gurs/raw}"

if [[ ! "$dataset_year" =~ ^[0-9]{4}$ ]]; then
  echo "Year must contain four digits." >&2
  exit 2
fi

case "$dataset_kind" in
  sales)
    display_group_id="127"
    display_product_id="321"
    first_year="2007"
    ;;
  rent)
    display_group_id="127"
    display_product_id="322"
    first_year="2013"
    ;;
  *)
    usage
    exit 2
    ;;
esac

if (( dataset_year < first_year )); then
  echo "$dataset_kind data starts in $first_year." >&2
  exit 2
fi

for required_command in curl jq; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "Missing required command: $required_command" >&2
    exit 1
  fi
done

mkdir -p "$output_directory"

temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

api_base="https://ipi.eprostor.gov.si/jgp-service-api"
product_base="$api_base/display-views/groups/$display_group_id/composite-products/$display_product_id"
common_arguments=(
  --get
  --data-urlencode "filterParam=DRZAVA"
  --data-urlencode "filterValue=1"
  --data-urlencode "filterYear=$dataset_year"
)

curl --fail --silent --show-error --location \
  "${common_arguments[@]}" \
  "$product_base/result" \
  --output "$temporary_directory/result.json"

file_name="$(jq -r '.file.name // empty' "$temporary_directory/result.json")"
expected_size="$(jq -r '.fileSize // empty' "$temporary_directory/result.json")"

if [[ -z "$file_name" ]]; then
  echo "GURS did not return a prepared file for $dataset_kind $dataset_year." >&2
  jq '.' "$temporary_directory/result.json" >&2
  exit 1
fi

curl --fail --silent --show-error --location \
  "${common_arguments[@]}" \
  "$product_base/file" \
  --output "$temporary_directory/download.json"

download_url="$(jq -r '.url // empty' "$temporary_directory/download.json")"

if [[ -z "$download_url" ]]; then
  echo "GURS did not return a download URL." >&2
  jq '.' "$temporary_directory/download.json" >&2
  exit 1
fi

target_path="$output_directory/$file_name"

if [[ -e "$target_path" ]]; then
  echo "Refusing to overwrite existing file: $target_path" >&2
  exit 1
fi

echo "Downloading $file_name${expected_size:+ ($expected_size bytes)}"
curl --fail --show-error --location \
  "$download_url" \
  --output "$temporary_directory/$file_name"

mv "$temporary_directory/$file_name" "$target_path"
echo "Saved $target_path"
