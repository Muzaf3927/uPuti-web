import { useEffect, useRef, useState } from "react";

export default function Support({ t }) {
    const [visible, setVisible] = useState(false);
    const hasShownOnScroll = useRef(false);

    useEffect(() => {
        const onScroll = () => {
            if (window.scrollY > 400 && !hasShownOnScroll.current) {
                hasShownOnScroll.current = true;
                setVisible(true);
            }
        };

        const onOpen = () => {
            setVisible(true);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("open-support", onOpen);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("open-support", onOpen);
        };
    }, []);

    const handleClose = () => {
        setVisible(false);
    };

    const handleOpenTelegram = () => {
        window.open("https://t.me/uputi_support", "_blank");
    };

    return (
        <div className={`support-popup ${visible ? "support-popup--visible" : ""}`}>
            <button
                type="button"
                className="support-popup__close"
                onClick={handleClose}
            >
                ×
            </button>
            <div className="support-popup__header">
                <img src="/logo.png" alt="UPuti" className="support-popup__logo" />
                <div>
                    <div className="support-popup__title">
                        {t.support}
                    </div>
                    <div className="support-popup__text">
                        {t.supportDesc}
                    </div>
                </div>
            </div>
            <button
                type="button"
                className="support-popup__button"
                onClick={handleOpenTelegram}
            >
                {t.supportSend}
            </button>
        </div>
    );
}

