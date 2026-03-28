# `shared/`

Cross-cutting Python modules imported by multiple services. Keep this layer small and stable: transport shapes, enums, and pure helpers—not service-specific business logic.

Services add `shared` to `PYTHONPATH` (see Dockerfiles) or install the tree as a package in later milestones.
