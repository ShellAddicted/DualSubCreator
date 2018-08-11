/* Subtitle.js
 * 
 * Copyright 2018 ShellAddicted <shelladdicted@gmail.com>
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

class SubtitleJSEntry {
    constructor(id, startTime, endTime, text) {    
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.text = text;
    }

    isMalformed(){
        return ((this.startTime == null) || (this.endTime == null) || (this.text == null));
    }

}

class SubtitleJS {
    constructor(entries = Array()) {
		this.entries = entries;
    }
    
	exportAsSubRip(eol = "\r\n"){
        var srt = "";
		this.entries.forEach(function(element) {
            srt += element.id + eol; // ID + EOL
			// StartTime
			srt += SubtitleJS.prettifyNumber(element.startTime.getHours()) + ":" + SubtitleJS.prettifyNumber(element.startTime.getMinutes()) + ":" + SubtitleJS.prettifyNumber(element.startTime.getSeconds()) + "," + SubtitleJS.prettifyNumber(element.startTime.getMilliseconds());
			// Timing Sep (with spaces before and after)
			srt += " --> ";
			// EndTime
			srt += SubtitleJS.prettifyNumber(element.endTime.getHours()) + ":" + SubtitleJS.prettifyNumber(element.endTime.getMinutes()) + ":" + SubtitleJS.prettifyNumber(element.endTime.getSeconds()) + "," + SubtitleJS.prettifyNumber(element.endTime.getMilliseconds());
			srt += eol; //TIMING EOL
			srt += element.text.replace(/\r\n|\n/,eol) + eol; // TEXT (replaces all EOL with selected eol argument to avoid multiple eol types) + EOL
			srt += eol; // EMPTY NEWLINE
            
		}, this);
		return srt;
    }

    static prettifyNumber(n){
        return (n > 9) ? ("" + n) : ("0" + n);
    }
    
    static parseTime(dataTime, floatSeparator = ","){
        var dataTime = dataTime.trim();
    
        var timeSplit = dataTime.split(floatSeparator);
        if (timeSplit.length < 2){
            return null;
        }
    
        var timeHrs = timeSplit[0].split(':');
        if (timeHrs.length < 3){
            return null;
        }
        
        var date = new Date(0);
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
    static parseFromSubRip(data, eol = "\r\n"){
        var currentEntry = new SubtitleJSEntry();
		var entries = Array();
		
        data.split(eol).forEach(function(element) {
			element = element.trim();
			
			//Empty Line -> Create a new Entry
			if (element == ""){ 
				if (!currentEntry.isMalformed()){
					// if currentEntry is valid, append it to the entries Array 
					entries.push(currentEntry);
				}
				// Create a new Entry
				currentEntry = new SubtitleJSEntry();
			}
	
			//Integer -> ID of the Entry
			else if (!isNaN(Number(element))){
				currentEntry.id = Number(element);
			}
	
			// --> in line -> TIMING
			// TODO: test this if
			else if (currentEntry.startTime == null & currentEntry.endTime == null & element.indexOf("-->") >= 0){
				currentEntry.startTime = element;
				currentEntry.endTime = element;
	
				var lnSplit = element.split("-->");
				if (lnSplit.length >= 2){
					currentEntry.startTime = SubtitleJS.parseTime(lnSplit[0], ",");
					currentEntry.endTime = SubtitleJS.parseTime(lnSplit[1], ",");
				}
			}
			
			// Text of the Entry
			else{
                // there's already some text in this entry, add an eol
                if (currentEntry.text == null){
                    currentEntry.text = "";
                }

				if (currentEntry.text != ""){
					currentEntry.text += eol;
				}
	
				// remove EOL for cleaner text value & Write text to the currentEntry
				currentEntry.text += element.replace(/\r\n$|\n$/,"");
			}
		}, this);
	
		//Sort results by startTime
		entries.sort(function(x,y){
			return x.startTime-y.startTime;
        });
        return new SubtitleJS(entries);
	}
}