<script lang="ts">
	type FieldDef = {
		id: string;
		label: string;
		type: string;
		required: boolean;
		placeholder?: string;
		helpText?: string;
	};
	type Schema = {
		id: string;
		slug: string;
		title?: string;
		description?: string | null;
		fields: FieldDef[];
	};

	let { schema, slug }: { schema: Schema; slug: string } = $props();

	let data = $state<Record<string, string>>({});
	let submitting = $state(false);
	let confirmation = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		error = null;
		try {
			const res = await fetch(
				`/api/biab/forms/${encodeURIComponent(slug)}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						data,
						submitterEmail: data.email,
						submitterName: data.name,
					}),
				},
			);
			if (!res.ok) throw new Error(await res.text());
			confirmation = "Thanks — we'll be in touch within one business day.";
			data = {};
		} catch (err) {
			error = err instanceof Error ? err.message : "Couldn't submit.";
		} finally {
			submitting = false;
		}
	}
</script>

<section class="biab-section biab-section--narrow" id="contact">
	{#if confirmation}
		<div class="biab-card contact">
			<span class="biab-badge" style="align-self: flex-start;">Received</span>
			<h2 class="biab-section__title">Got it.</h2>
			<p>{confirmation}</p>
		</div>
	{:else}
		<div class="biab-section__lead">
			<span class="biab-section__eyebrow">Contact</span>
			<h2 class="biab-section__title">{schema.title ?? 'Get in touch'}</h2>
			{#if schema.description}
				<p class="biab-section__sub">{schema.description}</p>
			{/if}
		</div>
		<form class="biab-card contact" onsubmit={handleSubmit}>
			{#each schema.fields as field (field.id)}
				<div>
					<label class="biab-label" for={`field-${field.id}`}>
						{field.label}{field.required ? ' *' : ''}
					</label>
					{#if field.type === 'textarea'}
						<textarea
							class="biab-textarea"
							id={`field-${field.id}`}
							placeholder={field.placeholder ?? ''}
							required={field.required}
							bind:value={data[field.id]}
						></textarea>
					{:else}
						<input
							class="biab-input"
							id={`field-${field.id}`}
							type={field.type === 'email' ? 'email' : 'text'}
							placeholder={field.placeholder ?? ''}
							required={field.required}
							bind:value={data[field.id]}
						/>
					{/if}
					{#if field.helpText}
						<small style="color: var(--text-muted);">{field.helpText}</small>
					{/if}
				</div>
			{/each}
			<button
				class="biab-btn"
				type="submit"
				disabled={submitting}
				style="align-self: flex-start;"
			>
				{submitting ? 'Sending…' : 'Send message'}
			</button>
			{#if error}
				<div
					style="color: var(--danger); background: var(--danger-bg); padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem;"
				>
					{error}
				</div>
			{/if}
		</form>
	{/if}
</section>
