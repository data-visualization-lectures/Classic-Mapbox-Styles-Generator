
const styleSelect = document.getElementById("style");
const form = document.getElementById("generator-form");
const message = document.getElementById("message");
const resultSection = document.getElementById("result-section");
const generatedUrlElem = document.getElementById("generated-url");
const downloadBtn = document.getElementById("download-btn");
const previewWrapper = document.getElementById("preview-wrapper");
const previewImg = document.getElementById("style-preview");
const previewBasePath = "style-previews";

async function loadStyles() {
    try {
        const response = await fetch("styles.csv");
        if (!response.ok) {
            throw new Error("CSV を読み込めませんでした。");
        }
        const csvText = await response.text();
        populateStyles(csvText);
    } catch (error) {
        message.textContent = error.message;
        message.style.color = "#c62828";
    }
}

function populateStyles(csvText) {
    const rows = csvText
        .trim()
        .split(/\r?\n/)
        .slice(1);

    rows.forEach((row) => {
        const [name, slug] = row.split(",");
        if (!name || !slug) {
            return;
        }
        const option = document.createElement("option");
        option.value = slug.trim();
        option.textContent = name.trim();
        styleSelect.appendChild(option);
    });
}

function updatePreview(slug) {
    if (!slug) {
        previewWrapper.hidden = true;
        previewImg.removeAttribute("src");
        previewImg.alt = "";
        return;
    }
    const selectedOption = styleSelect.options[styleSelect.selectedIndex];
    const name = selectedOption ? selectedOption.textContent.trim() : "";
    const imageSrc = `${previewBasePath}/${slug}.png`;
    previewImg.src = imageSrc;
    previewImg.alt = `${name} のプレビュー`;
    previewWrapper.hidden = false;
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    message.textContent = "";
    message.style.color = "#c62828";
    downloadBtn.disabled = true;

    const token = form.token.value.trim();
    const slug = styleSelect.value.trim();
    updatePreview(slug);

    if (!token || !slug) {
        message.textContent = "トークンとスタイルを入力してください。";
        message.style.color = "#c62828";
        resultSection.hidden = true;
        downloadBtn.disabled = true;
        return;
    }

    const url = `https://api.mapbox.com/styles/v1/mapbox/${slug}?access_token=${encodeURIComponent(
        token
    )}`;

    generatedUrlElem.textContent = url;
    resultSection.hidden = false;
    downloadBtn.disabled = false;
});

styleSelect.addEventListener("change", (event) => {
    const slug = event.target.value.trim();
    message.textContent = "";
    message.style.color = "#c62828";
    resultSection.hidden = true;
    downloadBtn.disabled = true;
    generatedUrlElem.textContent = "";
    updatePreview(slug);
});

previewImg.addEventListener("error", () => {
    previewWrapper.hidden = true;
    message.textContent = "プレビュー画像を読み込めませんでした。";
    message.style.color = "#c62828";
});

downloadBtn.addEventListener("click", async () => {
    const url = generatedUrlElem.textContent.trim();
    if (!url) {
        message.textContent = "先に URL を生成してください。";
        message.style.color = "#c62828";
        return;
    }

    downloadBtn.disabled = true;
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = "ダウンロード中...";

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `JSON の取得に失敗しました (HTTP ${response.status}).`
            );
        }

        const jsonData = await response.json();
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const objectUrl = URL.createObjectURL(blob);
        const filename = `${styleSelect.value || "style"}.json`;
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);

        message.textContent = "JSON をダウンロードしました。";
        message.style.color = "#2e7d32";
        setTimeout(() => {
            message.textContent = "";
            message.style.color = "#c62828";
        }, 2000);
    } catch (error) {
        console.error(error);
        message.textContent = error.message;
        message.style.color = "#c62828";
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;
    }
});

loadStyles();
