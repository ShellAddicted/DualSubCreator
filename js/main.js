/* main.js part DualSubCreator
 * 
 * Copyright 2017 ShellAddicted <shelladdicted@gmail.com>
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, 
 * check https://www.gnu.org/licenses/gpl-3.0-standalone.html
 * or write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
*/

var UPLOAD_SIZE_LIMIT = 1; // MegaByte(s)

var STYLES={
    "underline":{"start":"<u>","end":"</u>"},
    "bold":{"start":"<b>","end":"</b>"},
    "italic":{"start":"<i>","end":"</i>"}
};

var ALIGNMENTS={
    "TopLeft":"{\\an7}", "Top":"{\\an8}", "TopRight":"{\\an9}",
    "CenterLeft":"{\\an4}", "Center":"{\\an5}", "CenterRight":"{\\an6}",
    "BottomLeft":"{\\an1}", "Bottom":"{\\an2}", "BottomRight":"{\\an3}"
};

var lastObjURL = null;

var subtitles = {
	"colA":{
		"fileName": "",
		"options": {
			"style":"",
			"color":"",
			"size":"",
			"alignment":""
		},
		"subtitleObj": null
	},
	"colB":{
		"fileName": "",
		"options": {
			"style":"",
			"color":"",
			"size":"",
			"alignment":""
		},
		"subtitleObj": null
	}
}

function generateObjectURL(content, encoding, mimeType){
	if (typeof encoding === "undefined"){
		encoding = "utf-8";
	}

	if (typeof mimeType === "undefined"){
		mimeType = "text/plain";
	}

	if (lastObjURL !== null) {
        window.URL.revokeObjectURL(lastObjURL);
	}
	
	var blob = new Blob([content], {type: mimeType + ";" + "charset=" + encoding});
	return window.URL.createObjectURL(blob);
    // <a href="lastObjURL" download="fname">something</a>
}

function findBestSyncMatch(entry,entries,startIndex){
    var out = Array();
	var begin = null;

	if (typeof startIndex === "undefined"){
		startIndex = 0;
	}

	if (entries.length > 0 && startIndex < entries.length){
		var last = Math.abs(entry.startTime - entries[startIndex].startTime);
		for (i = (startIndex+1); i < entries.length; i++){
			var current = Math.abs(entry.startTime - entries[i].startTime)
			if (current > last){
				begin = (i-1);
				out.push(entries[(i-1)]);
				break;
			}
			else{
				last = current;
			}
		}

		if (out.length > 0){
			var last = Math.abs(entry.endTime - entries[begin].endTime);
			for (i = (begin+1); i < entries.length; i++){
				var current = Math.abs(entry.endTime - entries[i].endTime)
				if (current > last){
					break;
				}
				else{
					last = current;
					out.push(entries[i]);
				}
			}
		}
	}
    return out;
}

function mergeDualSub(subA, subB, callbackPercentage,eol){
	var count = 0;
	var c2 = 0;
	var result = new SubtitleJS();

	if (typeof eol === "undefined"){
		eol = result.DEFAULT_EOL;
	}

    // TODO: make this async
    subA.subtitleObj.entries.forEach(function(item){
		count++;
		callbackPercentage(((count*100)/subA.subtitleObj.entries.length)); // %

		c2++;
		var aEntry = new SubtitleJSEntry();
		aEntry.id = c2;
		aEntry.startTime = item.startTime;
		aEntry.endTime = item.endTime;
		aEntry.text = subA.options.begin + item.text + subA.options.end;
		result.entries.push(aEntry);

		matches = findBestSyncMatch(aEntry, subB.subtitleObj.entries);
		c2++;
		var bEntry = new SubtitleJSEntry();
		bEntry.id = c2;
		bEntry.startTime = item.startTime;
		bEntry.endTime = item.endTime;
		bEntry.text = subB.options.begin;

		for (var i = 0; i<matches.length; i++){
			bEntry.text += matches[i].text;
			if ((matches.length - i) > 1){
				bEntry.text += eol;
			}
		}
		bEntry.text += subB.options.end;
		result.entries.push(bEntry);
				
	}, this);
	callbackPercentage(100); // %
	console.log("merge ->> Done.");
	console.log(result);
    return result;
}

/* Bootstrap alerts managment */
function clearAlerts(){
	jQuery("#bsalert > span").text("");
	jQuery("#bsalert").hide().attr("class","alert");
}

function showAlert(kind,text){
	clearAlerts();
	jQuery("#bsalert > span").text(text);
	jQuery("#bsalert").addClass(kind).fadeIn();
}
/* </> Bootstrap alerts managment */

function invertColor(hexcolor){
	var color = null;
	if (hexcolor.substring(0,1) === "#"){
		color = hexcolor.substring(1); // remove '#' char
	}
	else{
		color = hexcolor.substring(0);
	}
	
	color = parseInt(color, 16); // cast from hex (string) to int
	if (isNaN(color)){
		return false;
	}

	color = 0xFFFFFF ^ color; // XOR three bytes
	color = color.toString(16); // re-cast to hex (string)
	color = ("000000" + color).slice(-6); // fix missing zeros
	color = "#" + color; // re-add '#' char
	return color;
} 

function readOptions(ctx){
	var out = {"begin":"","end":""};

    var optFontColorValue = jQuery(".colorPickerButton", ctx).val();
   	var optFontSizeValue  = jQuery("div[data-optionname=fontSize] input[type=text]",ctx).val();
    if (optFontColorValue.toLowerCase() != "default" || optFontSizeValue.toLowerCase() != "default"){
        out.begin += "<font ";
        if (optFontColorValue.toLowerCase() != "default"){
            out.begin +="color=\""+optFontColorValue.toLowerCase()+"\"";
        }
        if (optFontSizeValue.toLowerCase() != "default"){
			if (optFontColorValue.toLowerCase() != "default"){
				out.begin += " "; // Space to separate color and size
			}
            out.begin +="size=\""+optFontSizeValue.toLowerCase()+"\"";
        }
        out.begin +=">"
        out.end += "</font>"
    }

    var optStyleValue = jQuery("div[data-optionname=style] .active input",ctx).val();
    if (optStyleValue.toLowerCase() != "default"){
        var obx = STYLES[optStyleValue];
        out.begin += obx.start;
        out.end = obx.end + out.end;
    }
    
	var optAlignmentValue = jQuery(".options div[data-optionname=alignment] select",ctx).get(0).value;
	if (optAlignmentValue.toLowerCase() != "default"){
        var obx = ALIGNMENTS[optAlignmentValue];
        out.begin += obx;
    }
	
	return out;
}

function resetOptions(ctx){
	var ctx = jQuery(ctx);
	jQuery(".options .resetLink", ctx).click();
	jQuery(".options div[data-optionName=style] .btn", ctx).removeClass("active").removeAttr("checked").first().addClass("active").children("input").first().attr("checked","checked");
	jQuery(".options div[data-optionname=alignment] select",ctx).get(0).value = "Default";
}

function loadOptionsProfile(evt){
	ctx = jQuery(this).parents(".subCol");
	idx = jQuery(this).attr("data-suggestedOptionID");

	if (idx == "1"){
		resetOptions(ctx);
	}
	
	else if (idx == "2"){
		resetOptions(ctx);
		jQuery("div[data-optionName=fontColor] input[type=color]", ctx).val("#32cd32").trigger("change");
		jQuery("div[data-optionname=fontSize] input[type=text]", ctx).val("24").trigger("input");
	}

	else{
		console.log("ID => ?");
	}
}

function processSubs(){
	clearAlerts();
	if (subtitles["colA"].subtitleObj == null && subtitles["colB"].subtitleObj == null){
		showAlert("alert-danger custom-alert-danger", "Subtitles are missing.");
	}
	
	else if (subtitles["colA"].subtitleObj == null){
		showAlert("alert-danger custom-alert-danger", "Subtitle A is missing.");
	}
	
	else if (subtitles["colB"].subtitleObj == null){
		showAlert("alert-danger custom-alert-danger", "Subtitle B is missing.");
	}
	
	else if (jQuery(".options *:invalid").length > 0){
		showAlert("alert-danger custom-alert-danger", "Options are not Valid.");
	}
	
	else{
		subtitles["colA"].options = readOptions("#colA");
		subtitles["colB"].options = readOptions("#colB");

		var res = mergeDualSub(subtitles["colA"], subtitles["colB"],
			function(percentage){
				p = parseInt(percentage);
				jQuery("#downloadButton").val(p + "%");
				if (p >= 99){
					jQuery("#downloadButton").val("Create");
				}
			}
		);
		var url = generateObjectURL(res.exportAsSubRip());
		jQuery(".downloadArea > a").attr("download", "merged.srt").attr("href", url);
		return true;
	}

	jQuery(".downloadArea > a").attr("download", "").attr("href", ""); // reset download URL
	
	//Revoke download url
	window.URL.revokeObjectURL(lastObjURL);
	lastObjURL = null;

	return false;
}

/* DropZone Event Handlers */
function handleFileAdd(evt){
	evt.preventDefault();
	jQuery(this).removeClass("onDragOver"); // removeDragOverEffect
	clearAlerts();

	var fx = evt.target.files || evt.originalEvent.dataTransfer.files;
	if (fx.length > 0){
		var f = fx[0];
		if (fx.length > 1){
			showAlert("alert-warning custom-alert-warning","Multiple files Dropped, only first one will be used.");
		}
	}
	else{
		showAlert("alert-danger","No Files Dropped.");
		return;
	}

	if (!f.name.endsWith(".srt")){
		showAlert("alert-danger","File is not valid, only .srt (SubRip) are allowed.");
		return;
	}

	// size/100000: bytes -> Megabytes
	if ((f.size/1000000) > UPLOAD_SIZE_LIMIT){
		showAlert("alert-danger", "File is too big, Maximum size allowed is " + UPLOAD_SIZE_LIMIT + "MB.");
		return;
	}
	
	jQuery(".uploadSrt", this).hide();
	jQuery(".fileLabel", this).text(f.name).fadeIn();
	jQuery(".resetLink", this).fadeIn();
	jQuery(this).addClass("dropZoneFull");

	var fr = new FileReader();
	
	var qx = jQuery(this).parents(".subCol");
	var id = qx.attr("id");
	jQuery(".options",qx).fadeIn();
	
	fr.onloadend = function(){
		subtitles[id].subtitleObj = SubtitleJS.parseFromSubRip(fr.result);
		subtitles[id].fileName = f.name;
	}
	fr.readAsText(f);
}

function handleDragOver(evt){
	evt.preventDefault();
	evt.originalEvent.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy.
	jQuery(this).addClass("onDragOver"); //addDragOverEffect
}

function handleDragLeave(evt){
	evt.preventDefault();
	jQuery(this).removeClass("onDragOver"); // removeDragOverEffect
}

function handleBrowseClick(evt){
	jQuery("input[type=file]", jQuery(this).parents(".uploadSrt")).click();
}

function handleFileResetClick(evt){
	var ctx = jQuery(this).hide().parents(".subCol");

	jQuery(".options", ctx,).fadeOut();
	resetOptions(ctx);

	jQuery(".fileLabel", ctx).fadeOut().text("");
	jQuery(".dropZone",ctx).removeClass("dropZoneFull");
	jQuery(".uploadSrt", ctx).fadeIn();
	
	subtitles[ctx.attr("id")] = {"fileName": "", "options": {"begin":"","end":""}, "subtitleObj": null};
}
/* </> DropZone Event Handlers */

/* Options Event Handlers */

/* Options->FontSize Handlers */
function handleFontSizeInput(evt){
	var rst = jQuery(".resetLink", evt.target.parentElement);
	if (evt.target.value == "Default"){
		rst.hide();
	}
	else{
		rst.fadeIn();
	}

	if (evt.target.value != "Default" && isNaN(Number(evt.target.value))){
		jQuery(evt.target).get(0).setCustomValidity("Invalid: is not a Number");
	}

	else if (evt.target.value != "Default" && !Number.isInteger(Number(evt.target.value))){
		jQuery(evt.target).get(0).setCustomValidity("Invalid: cannot be a Float");
	}

	else if (Number(evt.target.value) <= 0){
		jQuery(evt.target).get(0).setCustomValidity("Invalid: cannot be lower or equal to 0");
	}

	else{
		jQuery(evt.target).get(0).setCustomValidity(""); //OK
	}

}

function handleFontSizeReset(evt){
	jQuery("input[type=text]", evt.target.parentElement).val("Default").trigger("input"); // reset
	jQuery(evt.target).hide();
}
/* </> Options->FontSize Handlers */

/* Options->Alignment Event Handlers */
function handleAlignmentReset(evt){
	jQuery("select",evt.target.parentElement).get(0).value = "Default";
	jQuery(this).hide();
}

function handleAlignmentChange(evt){
	if (jQuery("select",evt.target.parentElement).get(0).value != "Default"){
		jQuery(".resetLink", evt.target.parentElement).fadeIn();
	}
	else{
		jQuery(".resetLink", evt.target.parentElement).hide();
	}
}
/* </> Options->Alignment Event Handlers */

/* Options->ColorPicker Event Handlers */
function handleColorPickerClick(evt){
	jQuery("input[type=color]", evt.target.parentElement).click();
}

function handleColorPickerChanged(evt){
	jQuery(".colorPickerButton", evt.target.parentElement).css({"background-color":this.value, "border-color":this.value, "color":invertColor(this.value)}).attr("value", this.value.toUpperCase());
	jQuery(".resetLink", evt.target.parentElement).fadeIn();
}

function handleColorPickerReset(evt){
	jQuery(".colorPickerButton", evt.target.parentElement).css({"background-color":"", "border-color":"", "color":""}).attr("value", "Default");
	jQuery("input[type=color]", evt.target.parentElement).val(""); // reset
	jQuery(this).hide();
}
/* </> Options->ColorPicker Event Handlers */

function handleDownloadButtonClick(evt){
	if (processSubs() == true){
		jQuery("a", evt.target.parentElement)[0].click();
	}
}

function ignoreEvent(evt){
	evt.preventDefault();
}

function mainInit(){
	// Clone #colA
	$("#colA").clone().attr("id","colB").find("h2").text("Subtitle B").prevObject.appendTo("#row1");

	// Events listeners.

	// Handle files drag and drop on .dropZone
	jQuery(".dropZone").on("dragover", handleDragOver).on("dragleave", handleDragLeave).on("drop", handleFileAdd).on("change", handleFileAdd);

	// Handle file upload by Dialog
	jQuery(".browseButton").on("click", handleBrowseClick);

	jQuery(".dropZone .resetLink").on("click", handleFileResetClick);

	jQuery("#downloadButton").on("click", handleDownloadButtonClick);

	jQuery("div[data-optionName=fontColor] input[type=color]").on("change", handleColorPickerChanged);

	jQuery("div[data-optionName=fontColor] .colorPickerButton").on("click", handleColorPickerClick);
	
	jQuery("div[data-optionName=fontColor] .resetLink").on("click", handleColorPickerReset);

	jQuery("div[data-optionName=fontSize] input[type=text]").on("input", handleFontSizeInput);

	jQuery("div[data-optionName=fontSize] .resetLink").on("click", handleFontSizeReset).click(); //force value to reset to Default on load

	jQuery("div[data-optionName=alignment] .resetLink").on("click", handleAlignmentReset).click();
	jQuery("div[data-optionName=alignment] select").on("input", handleAlignmentChange);
	
	jQuery(".suggestedOptions button").on("click", loadOptionsProfile);

	jQuery(window).on("dragover", ignoreEvent).on("drop", ignoreEvent);

	$('#slidesZone').carousel({
        interval:0,
        pause: "true"
    });
}

mainInit();