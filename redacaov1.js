javascript:(function() {
    const enableActionHandler = event => {
        event.stopImmediatePropagation();
    };

    ['copy', 'cut', 'paste'].forEach(eventName => {
        document.addEventListener(eventName, enableActionHandler, true);
    });

    function showToastNotification(message) {
        const toastElement = document.createElement('div');
        toastElement.textContent = message;

        toastElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 12px 25px;
            border-radius: 6px;
            z-index: 99999;
            font-size: 14px;
            font-family: sans-serif;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;

        document.body.appendChild(toastElement);

        requestAnimationFrame(() => {
            toastElement.style.opacity = '1';
        });

        setTimeout(() => {
            toastElement.style.opacity = '0';
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.parentNode.removeChild(toastElement);
                }
            }, 500);
        }, 3000);
    }

    showToastNotification("Proteção contra Copiar/Colar desativada!");

})();
