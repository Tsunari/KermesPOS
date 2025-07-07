"use client";
import PageContainer from '../components/PageContainer';

export default function MenuPage() {
    return (
        <PageContainer>
            <div className="flex flex-col gap-8 items-center w-full max-w-2xl mx-auto pt-6">
                {/* Card 1: Embedded Website */}
                {/* <div className="bg-white/90 rounded-2xl shadow-lg p-4 border border-gray-200 w-full"> */}
                    {/* <h2 className="text-xl font-bold text-center mb-2 text-black">Üniversite Yurtlarımız</h2> */}
                    <div className="rounded-2xl overflow-hidden border border-gray-300 w-full max-w-3xl mx-auto">
                        <iframe
                            src="https://www.vikz-studentenwohnheime.de"
                            title="VIKZ Yurtlarımız Tanıtımı"
                            className="w-full h-[650px] rounded-2xl border-none"
                            allowFullScreen
                        />
                    </div>
                {/* </div> */}
                {/* Card 2: Erkek Yurtlarımız */}
                <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-200 w-full flex flex-col items-center">
                    <h2 className="text-lg font-bold mb-2 text-black">Erkek Yurtlarımız</h2>
                    <p className="text-gray-700 text-center">Erkek öğrencilere özel yurtlarımız hakkında bilgi yakında burada olacak.</p>
                </div>
                {/* Card 3: Kız Yurtlarımız */}
                <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-200 w-full flex flex-col items-center">
                    <h2 className="text-lg font-bold mb-2 text-black">Kız Yurtlarımız</h2>
                    <p className="text-gray-700 text-center">Kız öğrencilere özel yurtlarımız hakkında bilgi yakında burada olacak.</p>
                </div>
            </div>
        </PageContainer>
    );
}