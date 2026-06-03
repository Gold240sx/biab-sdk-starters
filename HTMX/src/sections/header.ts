import { html, render } from "../html";

export function renderHeader(): string {
	return render(html`
		<header class="header">
			<a class="brand" href="#hero">Your Business</a>
			<nav>
				<a href="#about">About</a>
				<a href="#services">Services</a>
				<a href="#blog">Blog</a>
				<a href="#contact">Contact</a>
			</nav>
		</header>
	`);
}

export function renderFooter(): string {
	const year = new Date().getFullYear();
	return render(html`
		<footer class="footer">
			<p>© ${year} Your Business — built on BIAB.</p>
		</footer>
	`);
}
