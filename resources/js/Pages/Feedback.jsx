// resources/js/Pages/Feedback.jsx
import React, { useEffect, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import {
    FaRegCalendarAlt,
    FaCommentDots,
    FaPaperPlane,
    FaCheckCircle,
} from "react-icons/fa";
import ReCAPTCHA from "react-google-recaptcha";

export default function Feedback({ isModal = false, onClose = null }) {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [honeypot, setHoneypot] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const { data, setData, post, reset, processing, errors } = useForm({
        date: "",
        first_name: "",
        last_name: "",
        message: "",
        schedule_id: "",
        terminal_id: "",
        captchaToken: "",
    });

    const submit = (e) => {
        e.preventDefault();

        if (honeypot) return;

        if (!data.captchaToken) {
            alert("Please verify you are not a robot.");
            return;
        }

        if (!data.schedule_id || !data.terminal_id) {
            alert("Please select a schedule and terminal.");
            return;
        }

        post(route("feedback.store"), {
            data: { ...data, website: honeypot },
            onSuccess: () => {
                reset();
                setData("captchaToken", "");

                if (isModal && onClose) onClose();

                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            },
        });
    };

    useEffect(() => {
        if (!data.date) return;
        setLoading(true);

        fetch(route("feedback.schedules", { date: data.date }))
            .then((res) => res.json())
            .then((result) => setSchedules(result))
            .catch((err) => console.error("Error fetching schedules:", err))
            .finally(() => setLoading(false));
    }, [data.date]);

    const groupZones = (routeDetails) => {
        const zonesMap = {};
        routeDetails.forEach((detail) => {
            const addZone = (zoneKey, terminalKey) => {
                const zone = detail[zoneKey];
                const terminal = detail[terminalKey];
                if (!zone?.id) return;
                if (!zonesMap[zone.id]) {
                    zonesMap[zone.id] = {
                        id: zone.id,
                        name: zone.name,
                        terminals: [],
                    };
                }
                if (
                    terminal &&
                    !zonesMap[zone.id].terminals.some(
                        (t) => t.id === terminal.id
                    )
                ) {
                    zonesMap[zone.id].terminals.push(terminal);
                }
            };
            addZone("from_zone", "from_terminal");
            addZone("to_zone", "to_terminal");
        });
        return Object.values(zonesMap);
    };

    return (
        <>
            {/* SUCCESS MODAL */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl ring-1 ring-gray-100 animate-[fadeIn_0.3s_ease-out]">
                        <FaCheckCircle className="mx-auto mb-4 text-5xl text-emerald-500" />
                        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                            Feedback Submitted
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Thank you for helping us improve our services.
                            <br />
                            This will close automatically in a few seconds.
                        </p>
                    </div>
                </div>
            )}

            <div
                className={`${
                    isModal
                        ? "max-h-[90vh] overflow-y-auto bg-transparent"
                        : "min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-10"
                }`}
            >
                {!isModal && <Head title="Feedback" />}

                <div
                    className={`relative mx-auto flex flex-col overflow-hidden rounded-3xl bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.15)] ring-1 ring-slate-200/60 backdrop-blur ${
                        isModal ? "w-full" : "w-full max-w-3xl lg:max-w-5xl"
                    }`}
                >
                    {/* Top Accent Bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-400" />

                    {/* Header */}
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 sm:px-8">
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 ring-1 ring-blue-600/20">
                                    <FaCommentDots className="text-2xl" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                                        Resident Feedback
                                    </h1>
                                    <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                                        Share your experience about today&apos;s
                                        garbage collection schedule.
                                    </p>
                                </div>
                            </div>

                            {!isModal && (
                                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                                    Your feedback directly helps improve our
                                    service.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="max-h-[75vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
                        <form
                            id="feedback-form"
                            onSubmit={submit}
                            className="space-y-7"
                        >
                            {/* Honeypot */}
                            <input
                                type="text"
                                name="website"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                                style={{ display: "none" }}
                                autoComplete="off"
                            />

                            {/* Section: Resident Info */}
                            <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-tight text-slate-800">
                                            Resident Details
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Please enter your name so we can
                                            better understand and respond to
                                            your feedback.
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                        Required
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
                                            First Name{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.first_name}
                                            onChange={(e) =>
                                                setData(
                                                    "first_name",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Juan"
                                        />
                                        {errors.first_name && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.first_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
                                            Last Name{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.last_name}
                                            onChange={(e) =>
                                                setData(
                                                    "last_name",
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Dela Cruz"
                                        />
                                        {errors.last_name && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.last_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Section: Date & Message */}
                            <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-tight text-slate-800">
                                            Feedback Details
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Select the date and describe your
                                            experience with the collection.
                                        </p>
                                    </div>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
                                        Collection Date{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaRegCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="date"
                                            value={data.date}
                                            onChange={(e) =>
                                                setData("date", e.target.value)
                                            }
                                            className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    {errors.date && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.date}
                                        </p>
                                    )}
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
                                        Message
                                    </label>
                                    <textarea
                                        value={data.message}
                                        onChange={(e) =>
                                            setData("message", e.target.value)
                                        }
                                        rows="4"
                                        placeholder="Share what went well or what needs improvement..."
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    {errors.message && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.message}
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* Section: Schedules & Terminals */}
                            {data.date && (
                                <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <h2 className="text-sm font-semibold tracking-tight text-slate-800">
                                                Schedules on{" "}
                                                <span className="font-semibold text-blue-600">
                                                    {data.date}
                                                </span>
                                            </h2>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Choose the specific terminal
                                                related to your feedback.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                            Required
                                        </span>
                                    </div>

                                    {loading ? (
                                        <p className="text-xs text-slate-500">
                                            Loading schedules...
                                        </p>
                                    ) : schedules.length === 0 ? (
                                        <p className="text-xs text-slate-500">
                                            No schedules found for this date.
                                        </p>
                                    ) : (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {schedules.map((schedule) => {
                                                const groupedZones =
                                                    groupZones(
                                                        schedule.route_details
                                                    );
                                                return (
                                                    <div
                                                        key={schedule.id}
                                                        className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500/60 hover:bg-white hover:shadow-md"
                                                    >
                                                        <div className="space-y-1.5 text-slate-700">
                                                            <p>
                                                                <span className="font-semibold">
                                                                    Truck:
                                                                </span>{" "}
                                                                {schedule
                                                                    .truck
                                                                    ?.plate ||
                                                                    "N/A"}{" "}
                                                                (
                                                                {schedule
                                                                    .truck
                                                                    ?.model ||
                                                                    "N/A"}
                                                                )
                                                            </p>
                                                            <p>
                                                                <span className="font-semibold">
                                                                    Driver:
                                                                </span>{" "}
                                                                {schedule
                                                                    .driver
                                                                    ?.name ||
                                                                    "N/A"}
                                                            </p>
                                                            <p>
                                                                <span className="font-semibold">
                                                                    Barangay:
                                                                </span>{" "}
                                                                {schedule
                                                                    .barangay
                                                                    ?.name ||
                                                                    "N/A"}
                                                            </p>
                                                        </div>

                                                        {groupedZones.length >
                                                            0 && (
                                                            <div className="mt-3 space-y-2">
                                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                    Zones &
                                                                    Terminals
                                                                </p>
                                                                {groupedZones.map(
                                                                    (zone) => (
                                                                        <div
                                                                            key={
                                                                                zone.id
                                                                            }
                                                                            className="mb-1"
                                                                        >
                                                                            <p className="text-xs font-medium text-slate-800">
                                                                                {
                                                                                    zone.name
                                                                                }
                                                                            </p>
                                                                            <ul className="mt-1 ml-3 space-y-1 text-[11px] text-slate-600">
                                                                                {zone.terminals.map(
                                                                                    (
                                                                                        terminal
                                                                                    ) => (
                                                                                        <li
                                                                                            key={
                                                                                                terminal.id
                                                                                            }
                                                                                        >
                                                                                            <label className="flex cursor-pointer items-center gap-2">
                                                                                                <input
                                                                                                    type="radio"
                                                                                                    name="terminal_id"
                                                                                                    value={
                                                                                                        terminal.id
                                                                                                    }
                                                                                                    checked={
                                                                                                        data.terminal_id ===
                                                                                                            terminal.id &&
                                                                                                        data.schedule_id ===
                                                                                                            schedule.id
                                                                                                    }
                                                                                                    onChange={() => {
                                                                                                        setData(
                                                                                                            "schedule_id",
                                                                                                            schedule.id
                                                                                                        );
                                                                                                        setData(
                                                                                                            "terminal_id",
                                                                                                            terminal.id
                                                                                                        );
                                                                                                    }}
                                                                                                    className="h-3.5 w-3.5 accent-blue-600"
                                                                                                />
                                                                                                <span>
                                                                                                    {
                                                                                                        terminal.name
                                                                                                    }
                                                                                                </span>
                                                                                            </label>
                                                                                        </li>
                                                                                    )
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {errors.terminal_id && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.terminal_id}
                                        </p>
                                    )}
                                    {errors.schedule_id && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.schedule_id}
                                        </p>
                                    )}
                                </section>
                            )}

                            {/* Section: reCAPTCHA */}
                            <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-600">
                                    Verification
                                </p>
                                <div className="space-y-2">
                                    <ReCAPTCHA
                                        sitekey={
                                            import.meta.env
                                                .VITE_RECAPTCHA_SITE_KEY
                                        }
                                        onChange={(token) =>
                                            setData("captchaToken", token)
                                        }
                                    />
                                    {errors.captchaToken && (
                                        <p className="text-xs text-red-500">
                                            {errors.captchaToken}
                                        </p>
                                    )}
                                    <p className="text-[11px] text-slate-500">
                                        This helps us prevent spam and ensure
                                        that feedback is coming from real
                                        residents.
                                    </p>
                                </div>
                            </section>
                        </form>
                    </div>

                    {/* Submit Bar */}
                    <div className="border-t border-slate-100 bg-white/95 px-6 py-4 sm:px-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[11px] text-slate-500">
                                By submitting, you agree that your feedback may
                                be used to improve city services.
                            </p>
                            <button
                                type="submit"
                                form="feedback-form"
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:from-blue-700 hover:to-sky-600 hover:shadow-lg hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                <FaPaperPlane className="text-sm" />
                                {processing
                                    ? "Submitting..."
                                    : "Submit Feedback"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}