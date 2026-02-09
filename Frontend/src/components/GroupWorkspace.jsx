import React from "react";
import { ExternalLink, Code, Github } from "lucide-react"; // install lucide-react if needed, or use text

const GroupWorkspace = ({ group }) => {
  // SAFETY CHECK: If the group doesn't have a repo, don't break the UI
  if (!group || !group.githubRepoUrl) {
    return null;
  }

  // LOGIC: Construct the direct "Create Codespace" URL
  const launchUrl = `${group.githubRepoUrl}`;

  return (
    <div className="w-full max-w-md bg-[#0d1117] border border-[#30363d] rounded-lg p-6 shadow-xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-md">
            <Code className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Dev Environment</h3>
        </div>
        <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full border border-green-400/20">
          Ready
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-6">
        Collaborate with your team in a real-time cloud environment.
        Pre-configured with Node.js v18.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Primary Button: LAUNCH */}
        <a
          href={launchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-md transition-all duration-200 shadow-[0_0_15px_rgba(35,134,54,0.4)] hover:shadow-[0_0_20px_rgba(46,160,67,0.6)]"
        >
          <span>Open Codespace</span>
          <ExternalLink className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Secondary Button: VIEW REPO */}
        <a
          href={group.githubRepoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#21262d] hover:bg-[#30363d] text-gray-300 font-medium rounded-md border border-[#30363d] transition-colors duration-200"
        >
          <Github className="w-4 h-4" />
          <span>View Repository</span>
        </a>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-[#30363d] flex justify-between items-center text-xs text-gray-500">
        <span>Branch: main</span>
        <span>• 2 vCPUs • 4GB RAM</span>
      </div>
    </div>
  );
};

export default GroupWorkspace;
