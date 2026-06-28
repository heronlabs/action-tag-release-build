// core/services/tagger-service
interface Tagger {
  // Based on the last commit, classify the commit as a semantic versioning type (major, minor, patch)
  // Use conventional commit messages, everything else default to patch
  classifyCommit(lastCommit: string): string;

  // Calculate the next version based on the current version and the semantic versioning type
  calculate(currentVersion: string, semantic: string): string;
}

// core/services/txt-service
interface Txt {
  // Get the current version from the txt file
  getVersion(): string;

  // Set the next version in the txt file
  setVersion(nextVersion: string): void;
}

// infrastructure/bumper-{claude|node|go|elixir}-service
interface Bumper {
  // Get the name of the bumper implementation (Node, Claude, Go, Elixir, etc.)
  getName(): string;

  // Bump the version in the specific implementation (Node, Claude, Go, Elixir, etc.)
  bumpVersion(nextVersion: string): void;
}

// infrastructure/github-service
interface Github {
  // Create the notes for the next version
  // Update the changelog file with notes
  // Create a release on GitHub with notes
  createReleaseChangelogNotes(): void
}

// infrastructure/git-service
interface Git {
  // Commit, tag and push all the changes related to the version bump
  // Given an optional overrideVersions boolean, if true, the tag for major (vX) and minor (vX.Y) versions will be overridden
  apply(overrideVersions?: boolean): void;

  // Get the last commit message from the git history
  getLastCommit(): string;
}

// application/bump-command
// Required specs:
// The bump command should be able to bump the version based on the last commit message if NO semantic versioning type is provided.
// The bump command should be able to bump the version based on the provided semantic versioning type if it is provided.
// The bump command should be able to bump the version in multiple implementations (Node, Claude, Go, Elixir, etc.) based on the provided options.
// The bump command should be able to override the major and minor tags if the overrideVersions option is provided.
// The bump command should be able to tag only the full version X.Y.Z if the overrideVersions option is NOT provided.
// The bump command should be able to create the notes in the changelog along with the release on GitHub.
// The bump command should be able to push all the changes in a single commit.
class BumpCommand {
  public bumpVersion(given: {
    semantic?: string;
    opts: { name: string }[];
    overrideVersions?: boolean;
  }): void {
    const version = this.txt.getVersion();
    let semantic = given.semantic;
    if (!semantic) {
      const lastCommit = this.git.getLastCommit();
      semantic = this.version.classifyCommit(lastCommit);
    }
    const nextVersion = this.version.calculate(version, semantic);
    this.txt.setVersion(nextVersion);
    for (const opt of given.opts) {
      const foundOptImplementation = this.bumpers.find((i) => i.getName() === opt.name);
      if(foundOptImplementation) foundOptImplementation.bumpVersion(nextVersion);
    }
    this.github.createReleaseChangelogNotes();
    this.git.apply(given.overrideVersions);
  }
  constructor(private txt: Txt, private git: Git, private bumpers: Bumper[], private version: Tagger, private github: Github) {}
}

