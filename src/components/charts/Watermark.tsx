import Image from 'next/image';

export default function Watermark() {
    return (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-5 select-none">
            <div className="relative flex items-center justify-center w-[300px] h-[150px] -rotate-12 scale-150">
                <Image
                    src="/datum-labs-logo.png"
                    alt="Datum Labs Watermark"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>
        </div>
    );
}
