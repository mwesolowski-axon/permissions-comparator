# Permissions Comparator

A browser-based tool for comparing JSON permission exports from Axon applications. Upload two or three JSON files to quickly identify permission differences across environments (e.g., Training vs Production).

## Quick Access

**[Open Permissions Comparator](https://mwesolowski-axon.github.io/permissions-comparator/)**

For fastest access, bookmark the link above in your browser.

## Features

- **Multi-file comparison** – Compare 2 or 3 JSON permission files side-by-side
- **Visual status indicators** – Instantly see which permissions match, mismatch, or are missing
- **Search & filter** – Filter results by category, description, or status
- **CSV export** – Download comparison results for documentation or further analysis
- **Dark/Light mode** – Toggle between themes for comfortable viewing
- **Fully client-side** – All processing happens in your browser—no data is uploaded to any server

## How to Use

1. Open the tool in your browser
2. Select your first JSON file (File A) and second JSON file (File B)
3. Optionally add a third file (File C) for three-way comparison
4. Click **Compare Files**
5. Review the results table showing all permissions and their status across files
6. Use the search box to filter specific permissions
7. Export results to CSV if needed

## Permission Status Legend

| Status | Meaning |
|--------|---------|
| **Match** | Permission exists and has the same enabled/disabled state in all files |
| **Mismatch** | Permission exists in all files but has different states |
| **Missing** | Permission exists in some files but not others |

## Input Format

The tool expects JSON files in the standard Axon privilege export format.

## Privacy

This tool runs entirely in your browser. Your permission data never leaves your machine—no server uploads, no external API calls.
