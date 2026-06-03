<script setup lang="ts">
import { reactive, ref } from "vue";

import type { FormSchema } from "../../../server/api/biab/home.get";

const props = defineProps<{ schema: FormSchema; slug: string }>();

const values = reactive<Record<string, string>>({});
const submitting = ref(false);
const confirmation = ref<string | null>(null);
const error = ref<string | null>(null);

async function handleSubmit() {
	submitting.value = true;
	error.value = null;
	try {
		await $fetch(`/api/biab/forms/${encodeURIComponent(props.slug)}`, {
			method: "POST",
			body: {
				data: { ...values },
				submitterEmail: values.email,
				submitterName: values.name,
			},
		});
		confirmation.value = "Thanks — we'll be in touch within one business day.";
		for (const k of Object.keys(values)) delete values[k];
	} catch (err) {
		error.value = err instanceof Error ? err.message : "Couldn't submit.";
	} finally {
		submitting.value = false;
	}
}
</script>

<template>
	<section class="biab-section biab-section--narrow" id="contact">
		<template v-if="confirmation">
			<div class="biab-card contact">
				<span class="biab-badge" style="align-self: flex-start;">Received</span>
				<h2 class="biab-section__title">Got it.</h2>
				<p>{{ confirmation }}</p>
			</div>
		</template>

		<template v-else>
			<div class="biab-section__lead">
				<span class="biab-section__eyebrow">Contact</span>
				<h2 class="biab-section__title">
					{{ schema.title ?? "Get in touch" }}
				</h2>
				<p v-if="schema.description" class="biab-section__sub">
					{{ schema.description }}
				</p>
			</div>

			<form class="biab-card contact" @submit.prevent="handleSubmit">
				<div v-for="field in schema.fields" :key="field.id">
					<label class="biab-label" :for="`field-${field.id}`">
						{{ field.label }}{{ field.required ? " *" : "" }}
					</label>
					<textarea
						v-if="field.type === 'textarea'"
						v-model="values[field.id]"
						class="biab-textarea"
						:id="`field-${field.id}`"
						:placeholder="field.placeholder ?? ''"
						:required="field.required"
					></textarea>
					<input
						v-else
						v-model="values[field.id]"
						class="biab-input"
						:id="`field-${field.id}`"
						:placeholder="field.placeholder ?? ''"
						:required="field.required"
						:type="field.type === 'email' ? 'email' : 'text'"
					/>
					<small v-if="field.helpText" style="color: var(--text-muted);">
						{{ field.helpText }}
					</small>
				</div>
				<button
					:disabled="submitting"
					class="biab-btn"
					style="align-self: flex-start;"
					type="submit"
				>
					{{ submitting ? "Sending…" : "Send message" }}
				</button>
				<div
					v-if="error"
					style="color: var(--danger); background: var(--danger-bg); padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem;"
				>
					{{ error }}
				</div>
			</form>
		</template>
	</section>
</template>
