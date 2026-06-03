import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
	selector: "biab-header",
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<header class="header">
			<a class="brand" href="#hero">Your Business</a>
			<nav>
				<a href="#about">About</a>
				<a href="#services">Services</a>
				<a href="#blog">Blog</a>
				<a href="#contact">Contact</a>
			</nav>
		</header>
	`,
})
export class HeaderComponent {}
