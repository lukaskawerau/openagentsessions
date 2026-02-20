export type SubmissionFormState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialSubmissionState: SubmissionFormState = {
  status: "idle",
  message: "",
};
