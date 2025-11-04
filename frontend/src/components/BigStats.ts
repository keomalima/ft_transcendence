export function  BigStat() : HTMLElement | null {
	const stats = document.getElementById('big-stats');
	if (stats)
	{
		stats.innerHTML = /*html*/`
		<div class="mx-auto max-w-7xl px-6 lg:px-8 ">
			<dl class="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
				<div class="mx-auto flex max-w-xs flex-col gap-y-1">
					<dt class="text-base/7 text-black">total won games</dt>
					<dd class="font-[Calistoga] order-first text-5xl tracking-tight text-black sm:text-8xl">3</dd>
				</div>
				<div class="mx-auto flex max-w-xs flex-col gap-y-1">
					<dt class="text-base/7 text-black">winning streak</dt>
					<dd class="font-[Calistoga] order-first text-5xl tracking-tight text-black sm:text-8xl">2</dd>
				</div>
				<div class="mx-auto flex max-w-xs flex-col gap-y-1">
					<dt class="text-base/7 text-black">total games played</dt>
					<dd class="font-[Calistoga] order-first text-5xl tracking-tight text-black sm:text-8xl">5</dd>
				</div>
				<div class="mx-auto flex max-w-xs flex-col gap-y-1">
					<dt class="text-base/7 text-black">Total playing time </dt>
					<dd class="font-[Calistoga] order-first text-5xl tracking-tight text-black sm:text-8xl">120''</dd>
				</div>
			</dl>
		</div>
		`
	}
	return stats;
}