/* SubRip.js
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

/* 	PrettifyNumber formats a Number as a Two Digit String
	Examples: PrettifyNumber(9) ->> "09" || PrettifyNumber(93) -> "93"
*/
function PrettifyNumber(n){
    return n > 9 ? "" + n: "0" + n;
}

function SubRip(srtText, eol){
	this.DEFAULT_EOL = "\r\n";
	
	this.currentEntry = new this.SubtitleEntry();
	this.entries = Array();
	
	if (typeof eol === "undefined"){
		eol = this.DEFAULT_EOL;
	}

	if (typeof srtText == "string"){
		this.parse(srtText, eol);
	}
}

/* Begin of Subtitle.SubtitleEntry object */
SubRip.prototype.SubtitleEntry = function(){
	this.id = null;
	this.startTime = null;
	this.endTime = null;
	this.text = "";
}

SubRip.prototype.SubtitleEntry.prototype.isMalformed = function(){
	if (this.startTime != null & this.endTime != null & this.text != ""){
		return false;
	}
	else{
		return true;
	}
}
/* End of Subtitle.SubtitleEntry object*/

SubRip.prototype._parseTime = function(dataTime){
	dataTime = dataTime.trim();

	timeSplit = dataTime.split(",");
	if (timeSplit.length < 2){
		return null;
	}

	timeHrs = timeSplit[0].split(':');
	if (timeHrs.length < 3){
		return null;
	}
	
	date = new Date(0);
	date.setHours(timeHrs[0]);
	date.setMinutes(timeHrs[1]);
	date.setSeconds(timeHrs[2]);
	date.setMilliseconds(timeSplit[1]);
	
	// Check is Date() Object is Valid
	if (isNaN(date)){
		return null;
	}
	return date;
}

SubRip.prototype.parse = function(data, eol){
	if (typeof eol === "undefined"){
		eol = this.DEFAULT_EOL;
	}

	data.split(eol).forEach(function(element) {
		element = element.trim();
		
		//Empty Line -> Create a new Entry
		if (element == ""){ 
			if (!this.currentEntry.isMalformed()){
				// if currentEntry is valid, append it to the entries Array 
				this.entries.push(this.currentEntry);
			}
			// Create a new Entry
			this.currentEntry = new this.SubtitleEntry();
		}

		//Integer -> ID of the Entry
		else if (!isNaN(Number(element))){
			this.currentEntry.id = Number(element);
		}

		// --> in line -> TIMING
		// TODO: test this if
		else if (this.currentEntry.startTime == null & this.currentEntry.endTime == null & element.indexOf("-->") >= 0){
			this.currentEntry.startTime = element;
			this.currentEntry.endTime = element;

			lnSplit = element.split("-->");
			if (lnSplit.length >= 2){
				this.currentEntry.startTime = this._parseTime(lnSplit[0]);
				this.currentEntry.endTime = this._parseTime(lnSplit[1]);
			}
		}
		
		// Text of the Entry
		else{
			// there's already some text in this entry, add an eol
			if (this.currentEntry.text != ""){
				this.currentEntry.text += eol;
			}

			// remove EOL for cleaner text value & Write text to the currentEntry
			this.currentEntry.text += element.replace(/\r\n$|\n$/,"");
		}
	}, this);

	//Sort results by startTime
	this.entries.sort(function(x,y){
		return x.startTime-y.startTime;
	});
}

SubRip.prototype.exportAsSubRip = function(eol){
	if (typeof eol === "undefined"){
		eol = this.DEFAULT_EOL;
	}
	var srt = "";
    this.entries.forEach(function(element) {
		srt += element.id + eol; // ID + EOL
		// StartTime
		srt += PrettifyNumber(element.startTime.getHours()) + ":" + PrettifyNumber(element.startTime.getMinutes()) + ":" + PrettifyNumber(element.startTime.getSeconds()) + "," + PrettifyNumber(element.startTime.getMilliseconds());
		// Timing Sep (with spaces before and after)
		srt += " --> ";
		// EndTime
        srt += PrettifyNumber(element.endTime.getHours()) + ":" + PrettifyNumber(element.endTime.getMinutes()) + ":" + PrettifyNumber(element.endTime.getSeconds()) + "," + PrettifyNumber(element.endTime.getMilliseconds());
		srt += eol; //TIMING EOL
		srt += element.text.replace(/\r\n|\n/,eol) + eol; // TEXT (replaces all EOL with selected eol argument to avoid multiple eol types) + EOL
		srt += eol; // EMPTY NEWLINE

    }, this);
    return srt;
}