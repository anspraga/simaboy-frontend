import { useState, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
    onRefresh: () => Promise<void>;
    children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: Props) {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        // Hanya aktif jika scroll sedang berada di paling atas
        if (scrollRef.current && scrollRef.current.scrollTop === 0) {
            setStartY(e.touches[0].clientY);
        } else {
            setStartY(0);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!startY || isRefreshing) return;
        const currentY = e.touches[0].clientY;
        const distance = currentY - startY;

        // Jika ditarik ke bawah (distance positif)
        if (distance > 0) {
            // Kalikan 0.4 agar tarikannya terasa berat/natural, maksimal ditarik 100px
            setPullDistance(Math.min(distance * 0.4, 100));
        }
    };

    const handleTouchEnd = async () => {
        // Jika ditarik lebih dari 60px, jalankan refresh
        if (pullDistance > 60 && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(60); // Tahan spinner di posisi 60px
            await onRefresh();
            setIsRefreshing(false);
        }
        // Kembalikan ke posisi semula
        setPullDistance(0);
        setStartY(0);
    };

    return (
        <div
            ref={scrollRef}
            className="h-full overflow-y-auto scroll-smooth"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Area Indikator Spinner / Panah */}
            <div
                className="flex justify-center items-center overflow-hidden transition-all duration-300"
                style={{ height: `${pullDistance}px`, opacity: pullDistance / 60 }}
            >
                {(isRefreshing || pullDistance > 60) ? (
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-5 h-5 text-teal-500 transform transition-transform" style={{ transform: `rotate(${pullDistance * 3}deg)` }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                )}
            </div>

            {/* Konten Utama */}
            {children}
        </div>
    );
}