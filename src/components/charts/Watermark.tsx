export default function Watermark() {
    return (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.04] mix-blend-plus-lighter select-none">
            <div className="flex items-center gap-4 -rotate-12 scale-150">
                <svg width="64" height="64" viewBox="0 0 100 100" fill="currentColor" className="text-white">
                    <path d="M25 0h30l40 40v20l-40 40H25v-20h20l20-20V40L45 20H25V0z" />
                    <path d="M0 40h20v40H0z" />
                    <path d="M20 80h20v20H20z" />
                </svg>
                <span className="text-6xl font-black tracking-tighter text-white">
                    Datum Labs
                </span>
            </div>
        </div>
    );
}
