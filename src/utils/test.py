def search_github_bfiles(target="Enterprise", output_csv="bfiles_fetched.csv", org=None):
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("⚠️  GITHUB_TOKEN is not set. Please export your GitHub token.")
        exit(1)

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {token}"
    }

    if target == "Enterprise":
        from tkinter import Tk, filedialog
        root = Tk()
        root.withdraw()
        input_csv = filedialog.askopenfilename(title="Select Repo CSV", filetypes=[("CSV Files", "*.csv")])
        if not input_csv:
            print("No CSV selected. Exiting.")
            exit(1)
        with open(input_csv, encoding='utf-8-sig') as f:
            repos = [row["repo"] for row in csv.DictReader(f) if "repo" in row]
        api_base = "https://github.cloud.capitalone.com/api/v3"
    else:
        from questionary import text
        org = text("Enter GitHub org name:").ask().strip()
        api_base = "https://api.github.com"
        repos = []
        url = f"{api_base}/orgs/{org}/repos"
        r = requests.get(url, headers=headers)
        if r.status_code == 200:
            repos = [repo["full_name"] for repo in r.json()]
        else:
            print("Error fetching repos")
            return []

    os.makedirs("bfiles", exist_ok=True)

    with open(output_csv, "w", encoding='utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["repo", "bfile_path", "flavor", "environments"])

    for repo in tqdm(repos, desc="📦 Checking Bogiefiles", unit="repo"):
        contents_url = f"{api_base}/repos/{repo}/contents"
    r = requests.get(contents_url, headers=headers)
    if r.status_code != 200:
        continue

    def recurse(contents):
        for item in contents:
            if item["type"] == "file" and item["name"].lower() == "bfile":
                try:
                    meta = requests.get(item["url"], headers=headers).json()
                    content = meta.get("content")
                    if not content:
                        continue
                    import base64
                    decoded = base64.b64decode(content).decode("utf-8")
                    parsed = yaml.safe_load(decoded)
                    if parsed.get("managed") is True:
                        flavor = parsed.get("flavor", "")
                        envs = parsed.get("environment", [])
                        if isinstance(envs, list):
                            envs_str = "-".join(envs)
                        else:
                            envs_str = str(envs)
                        writer.writerow([repo, item["path"], flavor, f"environments: {envs_str}"])
                except Exception as e:
                    print(f"Failed to parse {repo}: {e}")
            elif item["type"] == "dir":
                sub = requests.get(item["url"], headers=headers)
                if sub.status_code == 200:
                    recurse(sub.json())

    recurse(r.json())

print(f"✅ Completed Bfile discovery. Output saved to {output_csv}")
