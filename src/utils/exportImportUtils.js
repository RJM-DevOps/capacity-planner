export const buildExportData = (options) => {
    const data = {};
    if (options.pis) {
        const pis = localStorage.getItem("pis");
        if (pis) data.pis = JSON.parse(pis);
    }
    if (options.members) {
        const members = localStorage.getItem("memberDirectory");
        if (members) data.members = JSON.parse(members);
    }
    const config = JSON.parse(localStorage.getItem("configData") || "{}");
    for (let key of Object.keys(options)) {
        if (key !== "pis" && key !== "members" && options[key] && config[key]) {
            data[key] = config[key];
        }
    }
    return data;
};

export const processImportData = async (files) => {
    const configData = JSON.parse(localStorage.getItem("configData") || "{}");
    const updatedConfig = { ...configData };

    for (let file of files) {
        const content = await file.text();
        try {
            const parsed = JSON.parse(content);
            const name = file.name.replace(".json", "");

            if (name === "pis") {
                localStorage.setItem("pis", JSON.stringify(parsed));
            } else if (name === "members") {
                localStorage.setItem("memberDirectory", JSON.stringify(parsed));
            } else {
                updatedConfig[name] = parsed;
            }
        } catch (e) {
            console.error(`Failed to import ${file.name}:`, e);
        }
    }

    localStorage.setItem("configData", JSON.stringify(updatedConfig));
};
