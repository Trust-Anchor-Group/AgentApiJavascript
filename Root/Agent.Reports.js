AgentAPI["Reports"] =
{
	"GetReports": async function (JID, Language, DeviceToken, ServiceToken, UserToken)
	{
		var Response = await AgentAPI.Things.Concentrator.GetAllNodes(JID, Language, false, false,
			"Reports", null, DeviceToken, ServiceToken, UserToken);

		var Reports = [];
		var i, c = Response.length;

		for (i = 0; i < c; i++)
		{
			var Obj = Response[i];

			if (!Obj.parentId)
				continue;

			if (this.IsFalse(Obj.hasCommands))
				continue;

			if (this.IsTrue(Obj.hasChildren))
				continue;

			Reports.push(Obj.id);
		}

		AgentAPI.IO.AfterResponse(Reports);
		return Reports;
	},
	"IsFalse": function (x)
	{
		return x === null || x === undefined || x === false || (typeof x === "string" && x.toLowerCase() === "false");
	},
	"IsTrue": function (x)
	{
		return x === true || (typeof x === "string" && x.toLowerCase() === "true");
	},
	"GetReportParameters": async function (JID, Language, Report, DeviceToken, ServiceToken, UserToken)
	{
		return await AgentAPI.Things.Concentrator.GetCommandParameters(JID, Language,
			"Execute", Report, "Reports", null, DeviceToken, ServiceToken, UserToken);
	},
	"ExecuteReport": async function (JID, Language, Report, Parameters, DeviceToken, ServiceToken, UserToken)
	{
		return await AgentAPI.Things.Concentrator.ExecuteQuery(JID, Language, "Execute",
			Parameters, Report, "Reports", null, DeviceToken, ServiceToken, UserToken);
	}
};
