(() => {
    'use strict';

    const selectButton = document.getElementById('select-button');
    const fileInput = document.getElementById('file-input');
    const imageElement = document.getElementById('image-element');
    const sortSelect = document.getElementById('sort-select');
    const reverseCheckbox = document.getElementById('reverse-checkbox');
    const generateButton = document.getElementById('generate-button');
    const downloadAnchor = document.getElementById('download-anchor');
    const progressBar = document.getElementById('progress-bar');
    const canvasElement = document.getElementById('canvas-element');
    const outputImage = document.getElementById('output-image');

    initEventListeners();

    function initEventListeners() {
        selectButton.onclick = () => fileInput.click();
        fileInput.onchange = event => previewImage(event);

        generateButton.onclick = () => {
            startIndeterminate();

            setTimeout(() => {
                generateImage();
                finishProgress();

                const dataUrl = canvasElement.toDataURL('image/png');

                updateOutputImage(dataUrl);
                updateDownloadAnchor(dataUrl);
            }, 1000);
        };
    }

    function previewImage(event) {
        const { files } = event.target;
        const [ file ] = files;
        const fileReader = new FileReader();
        fileReader.onload = () => imageElement.src = fileReader.result;

        fileReader.readAsDataURL(file);
    }

    function generateImage() {
        const sortProperty = sortSelect.value;
        const shouldReverse = reverseCheckbox.checked;
        const { naturalWidth: width, naturalHeight: height } = imageElement;
        canvasElement.width = width;
        canvasElement.height = height;
        const context = canvasElement.getContext('2d');

        context.drawImage(imageElement, 0, 0);

        const pixels = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixel = context.getImageData(x, y, 1, 1);
                const [red, green, blue] = pixel.data;
                const [hue, saturation, lightness] = rgbToHsl(red, green, blue);

                pixels.push({
                    rgb: { red, green, blue},
                    hsv: { hue, saturation, lightness}
                });
            }
        }

        const sortedPixels = pixels.sort((a, b) => {
            return a.hsv[sortProperty] - b.hsv[sortProperty];
        });

        const finalPixels = shouldReverse ? sortedPixels.reverse() : sortedPixels;
        let index = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixel = finalPixels[index++];
                const { red, green, blue } = pixel.rgb;
                context.fillStyle = `rgb(${red}, ${green}, ${blue})`;

                context.fillRect(x, y, 1, 1);
            }
        }
    }

    function startIndeterminate() {
        progressBar.removeAttribute('value');
    }

    function finishProgress() {
        progressBar.setAttribute('value', '100');
    }

    // Source: https://gist.github.com/mjackson/5311256
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return [h, s, l];
    }

    function updateOutputImage(dataUrl) {
        outputImage.src = dataUrl;
    }

    function updateDownloadAnchor(dataUrl) {
        downloadAnchor.download = `${new Date().toISOString()}_pixelsort.png`;
        downloadAnchor.href = dataUrl.replace('image/png', 'image/octet-stream');
    }
})();
