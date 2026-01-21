export function XKubeLogo({ className = '', size = 32 }: { className?: string; size?: number }) {
    return (
        <div
            className={`rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ${className}`}
            style={{ width: size, height: size }}
        >
            <span className="text-white font-bold" style={{ fontSize: size * 0.6 }}>x</span>
        </div>
    )
}

export function XKubeLogoWithText({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <XKubeLogo size={40} />
            <div className="flex flex-col">
                <span className="font-bold text-xl text-white">xKube</span>
                <span className="text-[10px] text-white/60 uppercase tracking-wider">Platform</span>
            </div>
        </div>
    )
}
