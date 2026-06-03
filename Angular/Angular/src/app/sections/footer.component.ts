import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
	selector: "biab-footer",
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<footer class="footer">
			<p>© {{ year }} Your Business — built on BIAB.</p>
		</footer>
	`,
})
export class FooterComponent {
	readonly year = new Date().getFullYear();
}
