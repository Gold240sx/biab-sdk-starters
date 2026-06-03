"use client";

import { useEffect, useState } from "react";

import type { EventType } from "@/server/api/routers/biab";
import { api } from "@/trpc/react";

type Slot = { startAt: string; endAt: string };

function startOfTomorrow(): Date {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	d.setHours(0, 0, 0, 0);
	return d;
}
function plusWeek(d: Date): Date {
	const next = new Date(d);
	next.setDate(next.getDate() + 7);
	return next;
}
function formatSlotTime(iso: string): string {
	return new Date(iso).toLocaleString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

/**
 * Booking — uses the existing tRPC react setup. `useQuery` for
 * slot loading (refetches when `selectedSlug` changes via the
 * key in the query input), `useMutation` for confirm.
 */
export function Booking({ eventTypes }: { eventTypes: EventType[] }) {
	const [selectedSlug, setSelectedSlug] = useState<string>(
		eventTypes[0]?.slug ?? "",
	);
	const [pickedSlot, setPickedSlot] = useState<string | null>(null);
	const [invitee, setInvitee] = useState({
		name: "",
		email: "",
		phone: "",
		notes: "",
	});
	const [confirmation, setConfirmation] = useState<string | null>(null);

	const from = startOfTomorrow();
	const to = plusWeek(from);

	const slotsQuery = api.biab.fetchSlots.useQuery(
		{ slug: selectedSlug, from, to },
		{ enabled: !!selectedSlug },
	);

	const confirmBooking = api.biab.confirmBooking.useMutation({
		onSuccess: (result) => {
			setConfirmation(
				`Booking confirmed (#${result.bookingId.slice(0, 8)}). Check ${invitee.email} for details.`,
			);
		},
	});

	useEffect(() => {
		setPickedSlot(null);
	}, [selectedSlug]);

	if (confirmation) {
		return (
			<section className="biab-section biab-section--narrow" id="booking">
				<div className="biab-card booking">
					<span className="biab-badge" style={{ alignSelf: "flex-start" }}>
						Booked
					</span>
					<h2 className="biab-section__title">You're on the calendar.</h2>
					<p style={{ color: "var(--text)" }}>{confirmation}</p>
				</div>
			</section>
		);
	}

	const error = confirmBooking.error?.message ?? slotsQuery.error?.message;

	return (
		<section className="biab-section biab-section--narrow" id="booking">
			<div className="biab-section__lead">
				<span className="biab-section__eyebrow">Schedule</span>
				<h2 className="biab-section__title">Book a time</h2>
				<p className="biab-section__sub">
					Pick a slot and we'll send confirmation + a calendar invite.
				</p>
			</div>
			<div className="biab-card booking">
				{eventTypes.length === 0 ? (
					<div className="biab-empty">
						No event types configured yet. Add one in BIAB at Dashboard →
						Scheduling → Event Types.
					</div>
				) : (
					<>
						<div>
							<label className="biab-label" htmlFor="event-type">
								What for?
							</label>
							<select
								className="biab-select"
								id="event-type"
								onChange={(e) => setSelectedSlug(e.target.value)}
								value={selectedSlug}
							>
								{eventTypes.map((ev) => (
									<option key={ev.slug} value={ev.slug}>
										{`${ev.name} · ${ev.durationMinutes}min`}
									</option>
								))}
							</select>
						</div>

						<div>
							<div className="biab-label">Next available slots</div>
							{slotsQuery.isLoading ? (
								<div className="biab-loading">Computing availability…</div>
							) : (slotsQuery.data ?? []).length === 0 ? (
								<div className="biab-empty">
									No availability in the next week. Try another event type.
								</div>
							) : (
								<div className="booking__row">
									{(slotsQuery.data ?? [])
										.slice(0, 12)
										.map((slot: Slot) => (
											<button
												aria-pressed={pickedSlot === slot.startAt}
												className="slot-button"
												key={slot.startAt}
												onClick={() => setPickedSlot(slot.startAt)}
												type="button"
											>
												{formatSlotTime(slot.startAt)}
											</button>
										))}
								</div>
							)}
						</div>

						{pickedSlot ? (
							<>
								<div className="field-row field-row--cols">
									<div>
										<label className="biab-label" htmlFor="booking-name">
											Your name
										</label>
										<input
											className="biab-input"
											id="booking-name"
											onChange={(e) =>
												setInvitee({ ...invitee, name: e.target.value })
											}
											placeholder="Jane Doe"
											value={invitee.name}
										/>
									</div>
									<div>
										<label className="biab-label" htmlFor="booking-email">
											Email
										</label>
										<input
											className="biab-input"
											id="booking-email"
											onChange={(e) =>
												setInvitee({ ...invitee, email: e.target.value })
											}
											placeholder="jane@example.com"
											type="email"
											value={invitee.email}
										/>
									</div>
								</div>
								<div>
									<label className="biab-label" htmlFor="booking-phone">
										Phone (optional)
									</label>
									<input
										className="biab-input"
										id="booking-phone"
										onChange={(e) =>
											setInvitee({ ...invitee, phone: e.target.value })
										}
										placeholder="(555) 555-0100"
										type="tel"
										value={invitee.phone}
									/>
								</div>
								<div>
									<label className="biab-label" htmlFor="booking-notes">
										Anything we should know?
									</label>
									<textarea
										className="biab-textarea"
										id="booking-notes"
										onChange={(e) =>
											setInvitee({ ...invitee, notes: e.target.value })
										}
										placeholder="Optional"
										value={invitee.notes}
									/>
								</div>
								<button
									className="biab-btn"
									disabled={
										confirmBooking.isPending ||
										!invitee.email ||
										!invitee.name
									}
									onClick={() =>
										confirmBooking.mutate({
											eventTypeSlug: selectedSlug,
											startAt: new Date(pickedSlot),
											invitee: {
												email: invitee.email,
												name: invitee.name,
												phone: invitee.phone || null,
												timezone:
													Intl.DateTimeFormat().resolvedOptions().timeZone,
											},
											notes: invitee.notes || null,
										})
									}
									type="button"
								>
									{confirmBooking.isPending
										? "Confirming…"
										: `Book ${formatSlotTime(pickedSlot)}`}
								</button>
							</>
						) : null}

						{error ? (
							<div
								style={{
									color: "var(--danger)",
									background: "var(--danger-bg)",
									padding: "0.75rem 1rem",
									borderRadius: "0.5rem",
									fontSize: "0.9rem",
								}}
							>
								{error}
							</div>
						) : null}
					</>
				)}
			</div>
		</section>
	);
}
