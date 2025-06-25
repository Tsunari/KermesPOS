import PageContainer from '../components/PageContainer';

const settings = [
	{
		key: 'theme',
		name: 'Tema',
		description: 'Açık/Koyu tema arasında geçiş yapın',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Tema Değiştir
			</button>
		),
	},
  	{
		key: 'theme',
		name: 'Tema',
		description: 'Açık/Koyu tema arasında geçiş yapın',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Tema Değiştir
			</button>
		),
	},
  	{
		key: 'theme',
		name: 'Tema',
		description: 'Açık/Koyu tema arasında geçiş yapın',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Tema Değiştir
			</button>
		),
	},
  	{
		key: 'theme',
		name: 'Tema',
		description: 'Açık/Koyu tema arasında geçiş yapın',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Tema Değiştir
			</button>
		),
	},
  	{
		key: 'theme',
		name: 'Tema',
		description: 'Açık/Koyu tema arasında geçiş yapın',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Tema Değiştir
			</button>
		),
	},
  	{
		key: 'theme',
		name: 'Tema',
		description: 'Açık/Koyu tema arasında geçiş yapın',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Tema Değiştir
			</button>
		),
	},
  	{
		key: 'theme',
		name: 'Tema',
		description: 'Açık/Koyu tema arasında geçiş yapın',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Tema Değiştir
			</button>
		),
	},
	{
		key: 'notifications',
		name: 'Bildirimler',
		description: 'Bildirim tercihlerinizi yönetin',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Aç/Kapat
			</button>
		),
	},
	{
		key: 'about',
		name: 'Hakkında',
		description: 'Uygulama hakkında bilgi alın',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Görüntüle
			</button>
		),
	},
	{
		key: 'language',
		name: 'Dil',
		description: 'Uygulama dilini değiştirin',
		action: (
			<button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-black text-sm font-medium">
				Değiştir
			</button>
		),
	},
];

export default function SettingsPage() {
	return (
		<PageContainer>
      <h1 className="text-3xl font-extrabold text-black mb-4 text-center tracking-tight">
					Ayarlar
				</h1>
			<div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-200 mt-8">
				<ul className="divide-y divide-gray-200">
					{settings.map(setting => (
						<li
							key={setting.key}
							className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
						>
							<div>
								<span className="text-gray-800 font-medium block">
									{setting.name}
								</span>
								<span className="text-xs text-gray-500 block mt-1">
									{setting.description}
								</span>
							</div>
							<div>{setting.action}</div>
						</li>
					))}
				</ul>
			</div>
		</PageContainer>
	);
}